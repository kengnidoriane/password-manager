# EKS Cluster Module

# EKS Cluster IAM Role
resource "aws_iam_role" "cluster" {
  name = "${var.cluster_name}-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.cluster_name}-cluster-role"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.cluster.name
}

resource "aws_iam_role_policy_attachment" "cluster_vpc_resource_controller" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.cluster.name
}

# EKS Cluster Security Group
resource "aws_security_group" "cluster" {
  name        = "${var.cluster_name}-cluster-sg"
  description = "Security group for EKS cluster control plane"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.cluster_name}-cluster-sg"
    Environment = var.environment
  }
}

# EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = var.cluster_name
  role_arn = aws_iam_role.cluster.arn
  version  = var.cluster_version

  vpc_config {
    subnet_ids              = var.private_subnet_ids
    endpoint_private_access = true
    endpoint_public_access  = true
    security_group_ids      = [aws_security_group.cluster.id]
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  encryption_config {
    provider {
      key_arn = aws_kms_key.eks.arn
    }
    resources = ["secrets"]
  }

  depends_on = [
    aws_iam_role_policy_attachment.cluster_policy,
    aws_iam_role_policy_attachment.cluster_vpc_resource_controller,
    aws_cloudwatch_log_group.cluster
  ]

  tags = {
    Name        = var.cluster_name
    Environment = var.environment
  }
}

# CloudWatch Log Group for EKS
resource "aws_cloudwatch_log_group" "cluster" {
  name              = "/aws/eks/${var.cluster_name}/cluster"
  retention_in_days = 30

  tags = {
    Name        = "${var.cluster_name}-logs"
    Environment = var.environment
  }
}

# KMS Key for EKS encryption
resource "aws_kms_key" "eks" {
  description             = "EKS Secret Encryption Key for ${var.cluster_name}"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name        = "${var.cluster_name}-eks-key"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "eks" {
  name          = "alias/${var.cluster_name}-eks"
  target_key_id = aws_kms_key.eks.key_id
}

# Node Group IAM Role
resource "aws_iam_role" "node_group" {
  name = "${var.cluster_name}-node-group-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.cluster_name}-node-group-role"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "node_group_worker_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.node_group.name
}

resource "aws_iam_role_policy_attachment" "node_group_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.node_group.name
}

resource "aws_iam_role_policy_attachment" "node_group_registry_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.node_group.name
}

# Node Group Security Group
resource "aws_security_group" "node_group" {
  name        = "${var.cluster_name}-node-group-sg"
  description = "Security group for EKS worker nodes"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name                                        = "${var.cluster_name}-node-group-sg"
    Environment                                 = var.environment
    "kubernetes.io/cluster/${var.cluster_name}" = "owned"
  }
}

# Allow nodes to communicate with each other
resource "aws_security_group_rule" "node_group_ingress_self" {
  type              = "ingress"
  from_port         = 0
  to_port           = 65535
  protocol          = "-1"
  security_group_id = aws_security_group.node_group.id
  source_security_group_id = aws_security_group.node_group.id
  description       = "Allow nodes to communicate with each other"
}

# Allow nodes to communicate with cluster API
resource "aws_security_group_rule" "node_group_ingress_cluster" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  security_group_id = aws_security_group.node_group.id
  source_security_group_id = aws_security_group.cluster.id
  description       = "Allow worker nodes to receive communication from cluster control plane"
}

# Allow cluster to communicate with nodes
resource "aws_security_group_rule" "cluster_ingress_node_https" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  security_group_id = aws_security_group.cluster.id
  source_security_group_id = aws_security_group.node_group.id
  description       = "Allow cluster control plane to receive communication from worker nodes"
}

# EKS Node Groups
resource "aws_eks_node_group" "main" {
  for_each = var.node_groups

  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.cluster_name}-${each.key}"
  node_role_arn   = aws_iam_role.node_group.arn
  subnet_ids      = var.private_subnet_ids

  scaling_config {
    desired_size = each.value.desired_size
    max_size     = each.value.max_size
    min_size     = each.value.min_size
  }

  update_config {
    max_unavailable = 1
  }

  instance_types = each.value.instance_types
  capacity_type  = each.value.capacity_type
  disk_size      = each.value.disk_size

  labels = {
    Environment = var.environment
    NodeGroup   = each.key
  }

  tags = {
    Name        = "${var.cluster_name}-${each.key}-node-group"
    Environment = var.environment
  }

  depends_on = [
    aws_iam_role_policy_attachment.node_group_worker_policy,
    aws_iam_role_policy_attachment.node_group_cni_policy,
    aws_iam_role_policy_attachment.node_group_registry_policy,
  ]
}

# OIDC Provider for IRSA (IAM Roles for Service Accounts)
data "tls_certificate" "cluster" {
  url = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "cluster" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.cluster.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer

  tags = {
    Name        = "${var.cluster_name}-oidc-provider"
    Environment = var.environment
  }
}

# AWS Load Balancer Controller IAM Policy
resource "aws_iam_policy" "aws_load_balancer_controller" {
  name        = "${var.cluster_name}-aws-load-balancer-controller"
  description = "IAM policy for AWS Load Balancer Controller"

  policy = file("${path.module}/policies/aws-load-balancer-controller-policy.json")

  tags = {
    Name        = "${var.cluster_name}-aws-load-balancer-controller"
    Environment = var.environment
  }
}

# EBS CSI Driver IAM Policy
resource "aws_iam_policy" "ebs_csi_driver" {
  name        = "${var.cluster_name}-ebs-csi-driver"
  description = "IAM policy for EBS CSI Driver"

  policy = file("${path.module}/policies/ebs-csi-driver-policy.json")

  tags = {
    Name        = "${var.cluster_name}-ebs-csi-driver"
    Environment = var.environment
  }
}
