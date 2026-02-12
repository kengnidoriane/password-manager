# RDS PostgreSQL Module

# Generate random password for database
resource "random_password" "master_password" {
  length  = 32
  special = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "password-manager-${var.environment}-db-subnet"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name        = "password-manager-${var.environment}-db-subnet"
    Environment = var.environment
  }
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name        = "password-manager-${var.environment}-rds-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL from EKS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = var.allowed_security_groups
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "password-manager-${var.environment}-rds-sg"
    Environment = var.environment
  }
}

# Parameter Group
resource "aws_db_parameter_group" "main" {
  name   = "password-manager-${var.environment}-pg"
  family = "postgres15"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_duration"
    value = "1"
  }

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  parameter {
    name  = "max_connections"
    value = var.max_connections
  }

  tags = {
    Name        = "password-manager-${var.environment}-pg"
    Environment = var.environment
  }
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier     = "password-manager-${var.environment}"
  engine         = "postgres"
  engine_version = var.engine_version

  instance_class    = var.instance_class
  allocated_storage = var.allocated_storage
  storage_type      = var.storage_type
  storage_encrypted = true
  kms_key_id        = var.kms_key_id

  db_name  = var.database_name
  username = var.master_username
  password = random_password.master_password.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  parameter_group_name   = aws_db_parameter_group.main.name

  multi_az               = var.multi_az
  backup_retention_period = var.backup_retention_period
  backup_window          = var.backup_window
  maintenance_window     = var.maintenance_window

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  performance_insights_enabled    = var.performance_insights_enabled
  monitoring_interval             = var.monitoring_interval
  monitoring_role_arn             = var.monitoring_interval > 0 ? aws_iam_role.rds_monitoring[0].arn : null

  deletion_protection = var.deletion_protection
  skip_final_snapshot = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "password-manager-${var.environment}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  auto_minor_version_upgrade = true
  apply_immediately          = var.apply_immediately

  tags = merge(
    {
      Name        = "password-manager-${var.environment}"
      Environment = var.environment
    },
    var.additional_tags
  )
}

# IAM Role for Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  count = var.monitoring_interval > 0 ? 1 : 0

  name = "password-manager-${var.environment}-rds-monitoring"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "password-manager-${var.environment}-rds-monitoring"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  count = var.monitoring_interval > 0 ? 1 : 0

  role       = aws_iam_role.rds_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Store password in AWS Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name        = "password-manager/${var.environment}/database/master-password"
  description = "Master password for PostgreSQL database"

  tags = {
    Name        = "password-manager-${var.environment}-db-password"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = var.master_username
    password = random_password.master_password.result
    engine   = "postgres"
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
    dbname   = var.database_name
  })
}
