# Password Manager Infrastructure - Main Configuration
# This file orchestrates all infrastructure modules

terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  backend "s3" {
    bucket         = "password-manager-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "PasswordManager"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  environment         = var.environment
  vpc_cidr            = var.vpc_cidr
  availability_zones  = data.aws_availability_zones.available.names
  enable_nat_gateway  = true
  single_nat_gateway  = var.environment != "production"
}

# EKS Kubernetes Cluster Module
module "eks_cluster" {
  source = "./modules/eks-cluster"

  environment        = var.environment
  cluster_name       = "${var.project_name}-${var.environment}"
  cluster_version    = var.kubernetes_version
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  node_groups        = var.node_groups
}

# RDS PostgreSQL Module
module "postgresql" {
  source = "./modules/postgresql"

  environment             = var.environment
  vpc_id                  = module.vpc.vpc_id
  private_subnet_ids      = module.vpc.private_subnet_ids
  database_name           = var.database_name
  master_username         = var.database_master_username
  instance_class          = var.database_instance_class
  allocated_storage       = var.database_allocated_storage
  backup_retention_period = var.database_backup_retention
  multi_az                = var.environment == "production"
  allowed_security_groups = [module.eks_cluster.worker_security_group_id]
}

# ElastiCache Redis Module
module "redis" {
  source = "./modules/redis"

  environment             = var.environment
  vpc_id                  = module.vpc.vpc_id
  private_subnet_ids      = module.vpc.private_subnet_ids
  node_type               = var.redis_node_type
  num_cache_nodes         = var.redis_num_nodes
  automatic_failover      = var.environment == "production"
  allowed_security_groups = [module.eks_cluster.worker_security_group_id]
}

# Application Load Balancer Module
module "alb" {
  source = "./modules/alb"

  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  certificate_arn    = module.acm.certificate_arn
  enable_waf         = var.environment == "production"
  access_logs_bucket = module.s3_buckets.logs_bucket_domain_name
}

# CloudFront CDN Module
module "cdn" {
  source = "./modules/cdn"

  environment     = var.environment
  domain_name     = var.domain_name
  alb_dns_name    = module.alb.dns_name
  certificate_arn = module.acm_cloudfront.certificate_arn
  enable_logging  = true
  logging_bucket  = module.s3_buckets.logs_bucket_domain_name
  price_class     = var.cdn_price_class
}

# Route53 DNS Module
module "route53" {
  source = "./modules/route53"

  environment           = var.environment
  domain_name           = var.domain_name
  cloudfront_domain     = module.cdn.cloudfront_domain_name
  cloudfront_zone_id    = module.cdn.cloudfront_zone_id
  create_hosted_zone    = var.create_hosted_zone
  existing_zone_id      = var.existing_zone_id
}

# ACM SSL Certificate for ALB (Regional)
module "acm" {
  source = "./modules/acm"

  environment       = var.environment
  domain_name       = var.domain_name
  zone_id           = module.route53.zone_id
  validation_method = "DNS"
}

# ACM SSL Certificate for CloudFront (us-east-1)
module "acm_cloudfront" {
  source = "./modules/acm"

  providers = {
    aws = aws.us_east_1
  }

  environment       = var.environment
  domain_name       = var.domain_name
  zone_id           = module.route53.zone_id
  validation_method = "DNS"
}

# Monitoring Infrastructure Module
module "monitoring" {
  source = "./modules/monitoring"

  environment            = var.environment
  cluster_name           = module.eks_cluster.cluster_name
  vpc_id                 = module.vpc.vpc_id
  private_subnet_ids     = module.vpc.private_subnet_ids
  aws_region             = var.aws_region
  domain_name            = var.domain_name
  enable_prometheus      = true
  enable_grafana         = true
  enable_alertmanager    = true
  alert_email            = var.alert_email
  slack_webhook_url      = var.slack_webhook_url
}

# S3 Buckets for backups and logs
module "s3_buckets" {
  source = "./modules/s3"

  environment     = var.environment
  backup_bucket   = "${var.project_name}-${var.environment}-backups"
  logs_bucket     = "${var.project_name}-${var.environment}-logs"
  enable_versioning = true
  lifecycle_rules = var.s3_lifecycle_rules
}

# IAM Roles and Policies
module "iam" {
  source = "./modules/iam"

  environment           = var.environment
  cluster_name          = module.eks_cluster.cluster_name
  aws_region            = var.aws_region
  aws_account_id        = data.aws_caller_identity.current.account_id
  oidc_provider_arn     = module.eks_cluster.oidc_provider_arn
  oidc_provider_url     = module.eks_cluster.oidc_provider_url
  backup_bucket_arn     = module.s3_buckets.backup_bucket_arn
  logs_bucket_arn       = module.s3_buckets.logs_bucket_arn
  enable_irsa           = true
}

# Provider configuration for CloudFront certificates (must be in us-east-1)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "PasswordManager"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Configure Kubernetes provider
provider "kubernetes" {
  host                   = module.eks_cluster.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks_cluster.cluster_ca_certificate)
  
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args = [
      "eks",
      "get-token",
      "--cluster-name",
      module.eks_cluster.cluster_name
    ]
  }
}

# Configure Helm provider
provider "helm" {
  kubernetes {
    host                   = module.eks_cluster.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks_cluster.cluster_ca_certificate)
    
    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args = [
        "eks",
        "get-token",
        "--cluster-name",
        module.eks_cluster.cluster_name
      ]
    }
  }
}
