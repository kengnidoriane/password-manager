# Password Manager Infrastructure - Terraform

This directory contains Terraform configurations for deploying the Password Manager infrastructure on AWS.

## Architecture Overview

The infrastructure includes:

- **VPC**: Multi-AZ VPC with public and private subnets
- **EKS Cluster**: Kubernetes cluster for running containerized applications
- **RDS PostgreSQL**: Managed database with encryption and automated backups
- **ElastiCache Redis**: In-memory cache for sessions and caching
- **Application Load Balancer**: Layer 7 load balancer with WAF protection
- **CloudFront CDN**: Global content delivery network
- **Route53**: DNS management with health checks
- **ACM**: SSL/TLS certificates
- **S3**: Buckets for backups and logs
- **Monitoring**: Prometheus, Grafana, Loki, CloudWatch
- **IAM**: Roles for service accounts (IRSA)

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Terraform** >= 1.5.0
3. **kubectl** for Kubernetes management
4. **helm** for Kubernetes package management
5. **AWS Account** with appropriate permissions

## Directory Structure

```
terraform/
├── main.tf                 # Main configuration orchestrating all modules
├── variables.tf            # Global variables
├── outputs.tf              # Infrastructure outputs
├── terraform.tfvars        # Variable values (create from example)
├── environments/           # Environment-specific configurations
│   ├── dev.tfvars
│   ├── staging.tfvars
│   └── production.tfvars
└── modules/                # Reusable Terraform modules
    ├── vpc/
    ├── eks-cluster/
    ├── postgresql/
    ├── redis/
    ├── alb/
    ├── cdn/
    ├── route53/
    ├── acm/
    ├── monitoring/
    ├── s3/
    └── iam/
```

## Quick Start

### 1. Initialize Terraform

```bash
cd terraform
terraform init
```

### 2. Create S3 Backend (First Time Only)

Before running Terraform, create the S3 bucket and DynamoDB table for state management:

```bash
aws s3api create-bucket \
  --bucket password-manager-terraform-state \
  --region us-east-1

aws s3api put-bucket-versioning \
  --bucket password-manager-terraform-state \
  --versioning-configuration Status=Enabled

aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### 3. Create terraform.tfvars

Create a `terraform.tfvars` file with your specific values:

```hcl
aws_region  = "us-east-1"
environment = "development"
domain_name = "passwordmanager.example.com"
alert_email = "alerts@example.com"

# Optional: Slack webhook for alerts
slack_webhook_url = "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

Or use environment-specific files:

```bash
# Development
terraform plan -var-file="environments/dev.tfvars"

# Staging
terraform plan -var-file="environments/staging.tfvars"

# Production
terraform plan -var-file="environments/production.tfvars"
```

### 4. Plan Infrastructure

```bash
terraform plan -var-file="environments/dev.tfvars" -out=tfplan
```

### 5. Apply Infrastructure

```bash
terraform apply tfplan
```

### 6. Configure kubectl

After EKS cluster is created:

```bash
aws eks update-kubeconfig --region us-east-1 --name password-manager-development
```

### 7. Verify Deployment

```bash
kubectl get nodes
kubectl get pods -A
```

## Module Documentation

### VPC Module

Creates a multi-AZ VPC with:
- Public subnets for load balancers
- Private subnets for applications and databases
- NAT gateways for outbound internet access
- VPC endpoints for AWS services

### EKS Cluster Module

Provisions an EKS cluster with:
- Managed node groups with auto-scaling
- OIDC provider for IRSA
- Security groups and IAM roles
- CloudWatch logging

### PostgreSQL Module

Deploys RDS PostgreSQL with:
- Encryption at rest and in transit
- Automated backups with configurable retention
- Multi-AZ deployment (production)
- Performance Insights
- Enhanced monitoring

### Redis Module

Creates ElastiCache Redis with:
- Encryption at rest and in transit
- Auth token authentication
- Automatic failover (production)
- CloudWatch logging

### ALB Module

Configures Application Load Balancer with:
- HTTPS listener with SSL/TLS
- HTTP to HTTPS redirect
- Target groups for backend and frontend
- WAF integration (production)

### CDN Module

Sets up CloudFront distribution with:
- Custom domain and SSL certificate
- Security headers via CloudFront Functions
- Caching policies for static and dynamic content
- Origin access control

### Route53 Module

Manages DNS with:
- Hosted zone (optional)
- A and AAAA records
- Health checks
- CloudWatch alarms

### ACM Module

Provisions SSL certificates with:
- DNS validation
- Automatic renewal
- Support for multiple domains

### Monitoring Module

Deploys monitoring stack with:
- Prometheus for metrics collection
- Grafana for visualization
- Alertmanager for alerting
- Loki for log aggregation
- CloudWatch dashboards

### S3 Module

Creates S3 buckets for:
- Database backups with lifecycle policies
- Application logs with retention
- Encryption and versioning

### IAM Module

Configures IAM roles for:
- Backend service account (Secrets Manager access)
- Backup service account (S3 access)
- Cluster autoscaler
- AWS Load Balancer Controller

## Environment-Specific Configurations

### Development

- Single NAT gateway
- Smaller instance sizes
- No Multi-AZ
- Shorter backup retention
- WAF disabled

### Staging

- Single NAT gateway
- Medium instance sizes
- No Multi-AZ
- Standard backup retention
- WAF disabled

### Production

- Multi-AZ NAT gateways
- Larger instance sizes
- Multi-AZ enabled
- Extended backup retention
- WAF enabled
- Deletion protection enabled

## Outputs

After applying, Terraform outputs important information:

```bash
# View all outputs
terraform output

# View specific output
terraform output eks_cluster_endpoint
terraform output postgresql_endpoint
terraform output application_url

# View sensitive outputs
terraform output -json postgresql_master_password
terraform output -json grafana_admin_password
```

## Secrets Management

Sensitive values are stored in AWS Secrets Manager:

- Database credentials: `password-manager/{env}/database/master-password`
- Redis auth token: `password-manager/{env}/redis/auth-token`
- Grafana password: `password-manager/{env}/grafana/admin-password`

Retrieve secrets:

```bash
aws secretsmanager get-secret-value \
  --secret-id password-manager/development/database/master-password \
  --query SecretString \
  --output text | jq .
```

## Updating Infrastructure

### Update Kubernetes Version

1. Update `kubernetes_version` in variables
2. Plan and apply changes
3. Update node groups one at a time

### Scale Node Groups

Update `node_groups` configuration:

```hcl
node_groups = {
  general = {
    desired_size   = 5
    min_size       = 3
    max_size       = 15
    instance_types = ["t3.large"]
    capacity_type  = "ON_DEMAND"
    disk_size      = 50
  }
}
```

### Update Database

1. Create snapshot before changes
2. Update configuration
3. Apply during maintenance window

## Disaster Recovery

### Backup Strategy

- **Database**: Automated daily backups, 7-day retention
- **Redis**: Daily snapshots, 5-day retention
- **Application Data**: S3 with lifecycle policies

### Restore Procedures

#### Database Restore

```bash
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier password-manager-restored \
  --db-snapshot-identifier password-manager-snapshot-2024-01-01
```

#### Redis Restore

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id password-manager-restored \
  --snapshot-name password-manager-snapshot-2024-01-01
```

## Cost Optimization

### Development Environment

- Use t3.medium instances
- Single NAT gateway
- Disable Multi-AZ
- Shorter retention periods

### Production Environment

- Use Reserved Instances or Savings Plans
- Enable Auto Scaling
- Use S3 lifecycle policies
- Monitor with Cost Explorer

## Troubleshooting

### Terraform State Lock

If state is locked:

```bash
terraform force-unlock <LOCK_ID>
```

### EKS Access Issues

Update kubeconfig:

```bash
aws eks update-kubeconfig --region us-east-1 --name password-manager-development
```

### Module Errors

Validate configuration:

```bash
terraform validate
terraform fmt -recursive
```

## Security Best Practices

1. **Enable encryption** for all data at rest and in transit
2. **Use IAM roles** instead of access keys
3. **Enable MFA** for AWS accounts
4. **Restrict security groups** to minimum required access
5. **Enable CloudTrail** for audit logging
6. **Use Secrets Manager** for sensitive data
7. **Enable WAF** in production
8. **Regular security audits** with AWS Security Hub

## Maintenance

### Regular Tasks

- Review CloudWatch alarms weekly
- Update Terraform modules monthly
- Patch EKS cluster quarterly
- Review IAM permissions quarterly
- Test disaster recovery procedures quarterly

### Monitoring

Access monitoring dashboards:

- **Grafana**: `https://grafana-{env}.{domain}`
- **CloudWatch**: AWS Console
- **Prometheus**: Port-forward to access

## Cleanup

To destroy all infrastructure:

```bash
# WARNING: This will delete all resources
terraform destroy -var-file="environments/dev.tfvars"
```

## Support

For issues or questions:
1. Check Terraform documentation
2. Review AWS service documentation
3. Check CloudWatch logs
4. Contact DevOps team

## References

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
