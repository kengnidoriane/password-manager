# IAM Module for IRSA (IAM Roles for Service Accounts)

# Data source for OIDC provider
data "aws_iam_openid_connect_provider" "eks" {
  count = var.enable_irsa ? 1 : 0
  url   = var.oidc_provider_url
}

# IAM Role for Backend Service Account
resource "aws_iam_role" "backend_service_account" {
  count = var.enable_irsa ? 1 : 0

  name = "password-manager-${var.environment}-backend-sa"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = var.oidc_provider_arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "${replace(var.oidc_provider_url, "https://", "")}:sub" = "system:serviceaccount:default:backend-service-account"
            "${replace(var.oidc_provider_url, "https://", "")}:aud" = "sts.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "password-manager-${var.environment}-backend-sa"
    Environment = var.environment
  }
}

# IAM Policy for Backend (Secrets Manager access)
resource "aws_iam_policy" "backend_secrets" {
  count = var.enable_irsa ? 1 : 0

  name        = "password-manager-${var.environment}-backend-secrets"
  description = "Allow backend to access Secrets Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          "arn:aws:secretsmanager:${var.aws_region}:${var.aws_account_id}:secret:password-manager/${var.environment}/*"
        ]
      }
    ]
  })

  tags = {
    Name        = "password-manager-${var.environment}-backend-secrets"
    Environment = var.environment
  }
}

# Attach policy to backend role
resource "aws_iam_role_policy_attachment" "backend_secrets" {
  count = var.enable_irsa ? 1 : 0

  role       = aws_iam_role.backend_service_account[0].name
  policy_arn = aws_iam_policy.backend_secrets[0].arn
}

# IAM Role for Backup Service Account
resource "aws_iam_role" "backup_service_account" {
  count = var.enable_irsa ? 1 : 0

  name = "password-manager-${var.environment}-backup-sa"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = var.oidc_provider_arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "${replace(var.oidc_provider_url, "https://", "")}:sub" = "system:serviceaccount:default:backup-service-account"
            "${replace(var.oidc_provider_url, "https://", "")}:aud" = "sts.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "password-manager-${var.environment}-backup-sa"
    Environment = var.environment
  }
}

# IAM Policy for Backup (S3 access)
resource "aws_iam_policy" "backup_s3" {
  count = var.enable_irsa ? 1 : 0

  name        = "password-manager-${var.environment}-backup-s3"
  description = "Allow backup service to access S3"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:DeleteObject"
        ]
        Resource = [
          var.backup_bucket_arn,
          "${var.backup_bucket_arn}/*"
        ]
      }
    ]
  })

  tags = {
    Name        = "password-manager-${var.environment}-backup-s3"
    Environment = var.environment
  }
}

# Attach policy to backup role
resource "aws_iam_role_policy_attachment" "backup_s3" {
  count = var.enable_irsa ? 1 : 0

  role       = aws_iam_role.backup_service_account[0].name
  policy_arn = aws_iam_policy.backup_s3[0].arn
}

# IAM Role for Cluster Autoscaler
resource "aws_iam_role" "cluster_autoscaler" {
  count = var.enable_irsa ? 1 : 0

  name = "password-manager-${var.environment}-cluster-autoscaler"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = var.oidc_provider_arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "${replace(var.oidc_provider_url, "https://", "")}:sub" = "system:serviceaccount:kube-system:cluster-autoscaler"
            "${replace(var.oidc_provider_url, "https://", "")}:aud" = "sts.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "password-manager-${var.environment}-cluster-autoscaler"
    Environment = var.environment
  }
}

# IAM Policy for Cluster Autoscaler
resource "aws_iam_policy" "cluster_autoscaler" {
  count = var.enable_irsa ? 1 : 0

  name        = "password-manager-${var.environment}-cluster-autoscaler"
  description = "Allow cluster autoscaler to manage ASG"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "autoscaling:DescribeAutoScalingGroups",
          "autoscaling:DescribeAutoScalingInstances",
          "autoscaling:DescribeLaunchConfigurations",
          "autoscaling:DescribeScalingActivities",
          "autoscaling:DescribeTags",
          "ec2:DescribeInstanceTypes",
          "ec2:DescribeLaunchTemplateVersions"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "autoscaling:SetDesiredCapacity",
          "autoscaling:TerminateInstanceInAutoScalingGroup",
          "ec2:DescribeImages",
          "ec2:GetInstanceTypesFromInstanceRequirements",
          "eks:DescribeNodegroup"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "password-manager-${var.environment}-cluster-autoscaler"
    Environment = var.environment
  }
}

# Attach policy to cluster autoscaler role
resource "aws_iam_role_policy_attachment" "cluster_autoscaler" {
  count = var.enable_irsa ? 1 : 0

  role       = aws_iam_role.cluster_autoscaler[0].name
  policy_arn = aws_iam_policy.cluster_autoscaler[0].arn
}

# IAM Role for AWS Load Balancer Controller
resource "aws_iam_role" "aws_load_balancer_controller" {
  count = var.enable_irsa ? 1 : 0

  name = "password-manager-${var.environment}-aws-lb-controller"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = var.oidc_provider_arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "${replace(var.oidc_provider_url, "https://", "")}:sub" = "system:serviceaccount:kube-system:aws-load-balancer-controller"
            "${replace(var.oidc_provider_url, "https://", "")}:aud" = "sts.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "password-manager-${var.environment}-aws-lb-controller"
    Environment = var.environment
  }
}

# Attach AWS managed policy for Load Balancer Controller
resource "aws_iam_role_policy_attachment" "aws_load_balancer_controller" {
  count = var.enable_irsa ? 1 : 0

  role       = aws_iam_role.aws_load_balancer_controller[0].name
  policy_arn = "arn:aws:iam::aws:policy/AWSLoadBalancerControllerIAMPolicy"
}
