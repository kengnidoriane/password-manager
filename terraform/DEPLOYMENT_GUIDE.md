# Password Manager Infrastructure Deployment Guide

This guide provides step-by-step instructions for deploying the Password Manager infrastructure using Terraform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Deployment Steps](#deployment-steps)
4. [Post-Deployment Configuration](#post-deployment-configuration)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools

Install the following tools before proceeding:

```bash
# Terraform
brew install terraform  # macOS
# or download from https://www.terraform.io/downloads

# AWS CLI
brew install awscli  # macOS
# or download from https://aws.amazon.com/cli/

# kubectl
brew install kubectl  # macOS
# or download from https://kubernetes.io/docs/tasks/tools/

# Helm
brew install helm  # macOS
# or download from https://helm.sh/docs/intro/install/
```

### AWS Account Setup

1. **AWS Account**: You need an AWS account with appropriate permissions
2. **IAM User**: Create an IAM user with the following policies:
   - AdministratorAccess (for initial setup)
   - Or custom policy with permissions for:
     - VPC, EC2, EKS, RDS, ElastiCache, S3, CloudFront, Route53, ACM, IAM, CloudWatch

3. **AWS CLI Configuration**:

```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter your default region (e.g., us-east-1)
# Enter your default output format (json)
```

Verify configuration:

```bash
aws sts get-caller-identity
```

### Domain Name

You need a domain name for the application. Options:

1. **Existing Domain**: Use an existing domain with Route53 hosted zone
2. **New Domain**: Register a new domain through Route53 or another registrar

## Initial Setup

### Step 1: Create S3 Backend

Create S3 bucket and DynamoDB table for Terraform state:

```bash
# Create S3 bucket
aws s3api create-bucket \
  --bucket password-manager-terraform-state \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket password-manager-terraform-state \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket password-manager-terraform-state \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Block public access
aws s3api put-public-access-block \
  --bucket password-manager-terraform-state \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### Step 2: Configure Route53 (if needed)

If you don't have a hosted zone:

```bash
# Create hosted zone
aws route53 create-hosted-zone \
  --name passwordmanager.example.com \
  --caller-reference $(date +%s)

# Note the zone ID and name servers from the output
```

Update your domain registrar with the Route53 name servers.

### Step 3: Clone Repository

```bash
git clone <repository-url>
cd password-manager/terraform
```

### Step 4: Initialize Terraform

```bash
terraform init
```

This will:
- Download required providers
- Initialize the backend
- Prepare modules

## Deployment Steps

### Development Environment

#### 1. Create Configuration File

```bash
cp terraform.tfvars.example terraform.tfvars
# or use the environment-specific file
cp environments/dev.tfvars terraform.tfvars
```

#### 2. Edit Configuration

Edit `terraform.tfvars` with your values:

```hcl
aws_region  = "us-east-1"
environment = "development"
domain_name = "dev.passwordmanager.example.com"
alert_email = "dev-alerts@example.com"

# If you have an existing hosted zone
create_hosted_zone = false
existing_zone_id   = "Z1234567890ABC"
```

#### 3. Validate Configuration

```bash
terraform validate
terraform fmt -recursive
```

#### 4. Plan Deployment

```bash
terraform plan -var-file="terraform.tfvars" -out=tfplan
```

Review the plan carefully. It should show:
- VPC and networking resources
- EKS cluster and node groups
- RDS PostgreSQL instance
- ElastiCache Redis cluster
- Application Load Balancer
- CloudFront distribution
- Route53 records
- S3 buckets
- IAM roles
- Monitoring stack

#### 5. Apply Configuration

```bash
terraform apply tfplan
```

This will take approximately 20-30 minutes. The EKS cluster creation is the longest step.

#### 6. Save Outputs

```bash
terraform output > outputs.txt
terraform output -json > outputs.json
```

### Staging Environment

Follow the same steps but use `environments/staging.tfvars`:

```bash
terraform plan -var-file="environments/staging.tfvars" -out=tfplan
terraform apply tfplan
```

### Production Environment

For production, additional considerations:

1. **Review Security Settings**: Ensure WAF is enabled, Multi-AZ is configured
2. **Backup Strategy**: Verify backup retention periods
3. **Cost Estimation**: Use AWS Cost Calculator
4. **Change Management**: Follow your organization's change management process

```bash
terraform plan -var-file="environments/production.tfvars" -out=tfplan
# Review plan thoroughly
terraform apply tfplan
```

## Post-Deployment Configuration

### Step 1: Configure kubectl

```bash
# Get cluster name from outputs
CLUSTER_NAME=$(terraform output -raw eks_cluster_name)
AWS_REGION=$(terraform output -raw aws_region)

# Update kubeconfig
aws eks update-kubeconfig --region $AWS_REGION --name $CLUSTER_NAME

# Verify connection
kubectl get nodes
kubectl get pods -A
```

### Step 2: Retrieve Secrets

```bash
# Database credentials
aws secretsmanager get-secret-value \
  --secret-id password-manager/development/database/master-password \
  --query SecretString --output text | jq .

# Redis auth token
aws secretsmanager get-secret-value \
  --secret-id password-manager/development/redis/auth-token \
  --query SecretString --output text | jq .

# Grafana password
aws secretsmanager get-secret-value \
  --secret-id password-manager/development/grafana/admin-password \
  --query SecretString --output text | jq .
```

### Step 3: Create Kubernetes Secrets

Create secrets for the application:

```bash
# Database secret
kubectl create secret generic database-credentials \
  --from-literal=host=$(terraform output -raw postgresql_endpoint) \
  --from-literal=port=$(terraform output -raw postgresql_port) \
  --from-literal=database=$(terraform output -raw postgresql_database_name) \
  --from-literal=username=$(terraform output -raw postgresql_master_username) \
  --from-literal=password=$(terraform output -raw postgresql_master_password)

# Redis secret
kubectl create secret generic redis-credentials \
  --from-literal=host=$(terraform output -raw redis_endpoint) \
  --from-literal=port=$(terraform output -raw redis_port) \
  --from-literal=auth-token=$(terraform output -raw redis_auth_token)
```

### Step 4: Deploy Application

```bash
# Navigate to k8s directory
cd ../k8s

# Apply Kubernetes manifests
kubectl apply -k overlays/development
```

### Step 5: Configure DNS

If using external DNS provider, create CNAME record:

```
passwordmanager.example.com -> <cloudfront-domain-name>
```

Get CloudFront domain:

```bash
terraform output cloudfront_domain_name
```

### Step 6: Access Monitoring

#### Grafana

```bash
# Get Grafana password
GRAFANA_PASSWORD=$(terraform output -raw grafana_admin_password)

# Port forward to access locally
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Open browser to http://localhost:3000
# Username: admin
# Password: $GRAFANA_PASSWORD
```

#### Prometheus

```bash
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
# Open browser to http://localhost:9090
```

## Verification

### Infrastructure Verification

```bash
# Check all resources are created
terraform state list

# Verify outputs
terraform output

# Check EKS cluster
aws eks describe-cluster --name $(terraform output -raw eks_cluster_name)

# Check RDS instance
aws rds describe-db-instances --db-instance-identifier password-manager-development

# Check Redis cluster
aws elasticache describe-replication-groups --replication-group-id password-manager-development

# Check CloudFront distribution
aws cloudfront list-distributions
```

### Kubernetes Verification

```bash
# Check nodes
kubectl get nodes

# Check system pods
kubectl get pods -n kube-system

# Check monitoring
kubectl get pods -n monitoring

# Check application pods
kubectl get pods

# Check services
kubectl get svc

# Check ingress
kubectl get ingress
```

### Application Verification

```bash
# Check health endpoint
curl https://dev.passwordmanager.example.com/api/v1/health

# Check frontend
curl https://dev.passwordmanager.example.com
```

## Troubleshooting

### Terraform Errors

#### State Lock Error

```bash
# If state is locked
terraform force-unlock <LOCK_ID>
```

#### Provider Version Conflicts

```bash
# Upgrade providers
terraform init -upgrade
```

#### Module Errors

```bash
# Validate all modules
terraform validate

# Format code
terraform fmt -recursive
```

### EKS Issues

#### Cannot Connect to Cluster

```bash
# Update kubeconfig
aws eks update-kubeconfig --region us-east-1 --name password-manager-development

# Check AWS credentials
aws sts get-caller-identity

# Verify cluster exists
aws eks describe-cluster --name password-manager-development
```

#### Nodes Not Ready

```bash
# Check node status
kubectl get nodes

# Describe node
kubectl describe node <node-name>

# Check node logs
kubectl logs -n kube-system -l app=aws-node
```

### Database Issues

#### Cannot Connect

```bash
# Check security group
aws ec2 describe-security-groups --group-ids <sg-id>

# Test connection from EKS
kubectl run -it --rm debug --image=postgres:15 --restart=Never -- \
  psql -h <db-endpoint> -U dbadmin -d passwordmanager
```

### DNS Issues

#### Domain Not Resolving

```bash
# Check Route53 records
aws route53 list-resource-record-sets --hosted-zone-id <zone-id>

# Test DNS resolution
dig passwordmanager.example.com
nslookup passwordmanager.example.com
```

#### SSL Certificate Issues

```bash
# Check certificate status
aws acm describe-certificate --certificate-arn <cert-arn>

# Verify DNS validation records
aws route53 list-resource-record-sets --hosted-zone-id <zone-id> | grep _acm
```

### Monitoring Issues

#### Prometheus Not Scraping

```bash
# Check Prometheus targets
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
# Open http://localhost:9090/targets
```

#### Grafana Not Accessible

```bash
# Check Grafana pod
kubectl get pods -n monitoring -l app.kubernetes.io/name=grafana

# Check logs
kubectl logs -n monitoring -l app.kubernetes.io/name=grafana
```

## Rollback Procedures

### Rollback Terraform Changes

```bash
# Revert to previous state
terraform state pull > backup.tfstate
terraform state push previous.tfstate

# Or destroy and recreate
terraform destroy -var-file="terraform.tfvars"
terraform apply -var-file="terraform.tfvars"
```

### Rollback Application

```bash
# Use Kubernetes rollback
kubectl rollout undo deployment/backend
kubectl rollout undo deployment/frontend
```

## Maintenance

### Regular Tasks

- **Weekly**: Review CloudWatch alarms and Grafana dashboards
- **Monthly**: Update Terraform modules and providers
- **Quarterly**: Review and update EKS cluster version
- **Quarterly**: Review IAM permissions and security groups

### Updates

#### Update Terraform Modules

```bash
terraform init -upgrade
terraform plan
terraform apply
```

#### Update EKS Cluster

```bash
# Update cluster version in variables
# Plan and apply
terraform plan -var-file="terraform.tfvars"
terraform apply
```

## Cost Optimization

### Development Environment

- Use smaller instance types
- Single NAT gateway
- Disable Multi-AZ
- Shorter backup retention

### Production Environment

- Use Reserved Instances or Savings Plans
- Enable Auto Scaling
- Use S3 lifecycle policies
- Monitor with Cost Explorer

## Security Best Practices

1. Enable MFA for AWS accounts
2. Use IAM roles instead of access keys
3. Enable CloudTrail for audit logging
4. Regular security audits
5. Keep Terraform and providers updated
6. Use Secrets Manager for sensitive data
7. Enable encryption for all data
8. Regular backup testing

## Support

For issues or questions:
1. Check this guide
2. Review Terraform documentation
3. Check AWS service documentation
4. Review CloudWatch logs
5. Contact DevOps team

## Next Steps

After successful deployment:

1. Deploy application using Kubernetes manifests
2. Configure monitoring alerts
3. Set up backup procedures
4. Configure CI/CD pipeline
5. Perform security audit
6. Load testing
7. Documentation updates
