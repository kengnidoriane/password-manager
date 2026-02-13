# Deployment Scripts

This directory contains scripts for deploying and managing the Password Manager application.

## Available Scripts

### Deployment Scripts

#### `deploy-staging.sh`
Comprehensive staging deployment script that automates the entire deployment process.

**Usage:**
```bash
chmod +x deploy-staging.sh
./deploy-staging.sh
```

**Features:**
- Checks prerequisites (terraform, kubectl, aws, docker)
- Applies Terraform configuration
- Configures kubectl for EKS cluster
- Runs database migrations
- Deploys to Kubernetes
- Configures monitoring and logging
- Runs smoke tests
- Verifies deployment

**Interactive Mode:**
The script provides an interactive menu to run specific steps or all steps at once.

---

#### `build-images.sh` / `build-images.bat`
Builds and pushes Docker images for backend and frontend.

**Usage:**
```bash
# Linux/Mac
chmod +x build-images.sh
./build-images.sh [environment]

# Windows
build-images.bat [environment]
```

**Arguments:**
- `environment`: Optional. Defaults to `latest`. Can be `staging`, `production`, or a version tag.

**Example:**
```bash
./build-images.sh staging
./build-images.sh v1.2.0
```

---

### Testing Scripts

#### `smoke-tests.sh`
Comprehensive smoke tests for deployment verification.

**Usage:**
```bash
chmod +x smoke-tests.sh
./smoke-tests.sh [environment] [base-url]
```

**Arguments:**
- `environment`: Optional. Defaults to `staging`. Can be `staging` or `production`.
- `base-url`: Optional. Base URL of the application. Auto-detected if not provided.

**Example:**
```bash
./smoke-tests.sh staging
./smoke-tests.sh production https://passwordmanager.example.com
```

**Tests Performed:**
1. Frontend accessibility
2. Backend health endpoint
3. Backend actuator health
4. Database connectivity
5. Redis connectivity
6. Registration endpoint availability
7. Login endpoint availability
8. CORS headers
9. Security headers
10. TLS/SSL certificate
11. Response time
12. Swagger UI availability
13. Metrics endpoint
14. Rate limiting

---

#### `verify-deployment.sh`
Verifies all aspects of the deployment are working correctly.

**Usage:**
```bash
chmod +x verify-deployment.sh
./verify-deployment.sh [namespace] [environment]
```

**Arguments:**
- `namespace`: Optional. Defaults to `password-manager`.
- `environment`: Optional. Defaults to `staging`.

**Example:**
```bash
./verify-deployment.sh
./verify-deployment.sh password-manager production
```

**Checks Performed:**
1. All pods are running
2. All deployments are available
3. Services have endpoints
4. Ingress is configured
5. TLS secrets exist
6. ConfigMaps exist
7. Secrets exist
8. HPA is configured
9. PDB is configured
10. Resource limits are set
11. Persistent volumes are bound
12. No pods are restarting frequently
13. Pod logs don't have excessive errors
14. Network policies are configured
15. Resource quotas are configured
16. Monitoring is configured
17. Database connectivity from backend
18. Redis connectivity from backend
19. Frontend can reach backend
20. Resource usage is acceptable

---

### Utility Scripts

#### `deploy.sh` / `rollback.sh`
Located in the `k8s/` directory. See [k8s/README.md](../k8s/README.md) for details.

---

## Prerequisites

### Required Tools

All scripts require the following tools to be installed:

- **bash** (v4.0+): Shell interpreter
- **curl**: HTTP client for testing
- **jq**: JSON processor
- **kubectl** (v1.24+): Kubernetes CLI
- **docker** (v20.10+): Container runtime
- **terraform** (v1.5+): Infrastructure as Code (for deployment scripts)
- **aws** (v2.0+): AWS CLI (for AWS deployments)

### Installation

**macOS:**
```bash
brew install bash curl jq kubectl docker terraform awscli
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y bash curl jq kubectl docker.io
# Install terraform and aws-cli separately
```

**Windows:**
Use WSL2 (Windows Subsystem for Linux) or Git Bash.

---

## Script Permissions

Make scripts executable before running:

```bash
chmod +x deploy-staging.sh
chmod +x smoke-tests.sh
chmod +x verify-deployment.sh
chmod +x build-images.sh
```

Or make all scripts executable at once:

```bash
chmod +x *.sh
```

---

## Environment Variables

Some scripts use environment variables for configuration:

### `deploy-staging.sh`
- `AWS_REGION`: AWS region (default: `us-east-1`)
- `TERRAFORM_DIR`: Path to terraform directory (default: `../terraform`)
- `K8S_DIR`: Path to k8s directory (default: `../k8s`)
- `NAMESPACE`: Kubernetes namespace (default: `password-manager`)

### `smoke-tests.sh`
- `TIMEOUT`: HTTP request timeout in seconds (default: `10`)

### `verify-deployment.sh`
- No environment variables required

---

## Usage Examples

### Complete Staging Deployment

```bash
# 1. Build and push images
./build-images.sh staging

# 2. Deploy to staging
./deploy-staging.sh
# Select option 8 (All of the above)

# 3. Verify deployment
./verify-deployment.sh password-manager staging

# 4. Run smoke tests
./smoke-tests.sh staging
```

### Quick Smoke Test

```bash
# Test staging environment
./smoke-tests.sh staging

# Test production environment
./smoke-tests.sh production
```

### Verify Specific Namespace

```bash
# Verify default namespace
./verify-deployment.sh

# Verify custom namespace
./verify-deployment.sh my-namespace production
```

---

## Troubleshooting

### Script Fails with "Permission Denied"

```bash
# Make script executable
chmod +x script-name.sh
```

### Script Fails with "Command Not Found"

```bash
# Check if required tool is installed
which kubectl
which terraform
which aws

# Install missing tools
brew install <tool-name>  # macOS
sudo apt-get install <tool-name>  # Ubuntu/Debian
```

### AWS Credentials Not Configured

```bash
# Configure AWS credentials
aws configure

# Verify configuration
aws sts get-caller-identity
```

### Kubernetes Context Not Set

```bash
# List available contexts
kubectl config get-contexts

# Set context
kubectl config use-context <context-name>

# Or update kubeconfig for EKS
aws eks update-kubeconfig --region us-east-1 --name <cluster-name>
```

### Smoke Tests Failing

```bash
# Check application logs
kubectl logs -f deployment/backend -n password-manager

# Check if pods are running
kubectl get pods -n password-manager

# Test endpoints manually
curl -v https://staging.passwordmanager.example.com/api/v1/health
```

---

## CI/CD Integration

These scripts can be integrated into CI/CD pipelines:

### GitHub Actions Example

```yaml
- name: Deploy to Staging
  run: |
    cd scripts
    chmod +x deploy-staging.sh
    ./deploy-staging.sh

- name: Run Smoke Tests
  run: |
    cd scripts
    chmod +x smoke-tests.sh
    ./smoke-tests.sh staging

- name: Verify Deployment
  run: |
    cd scripts
    chmod +x verify-deployment.sh
    ./verify-deployment.sh password-manager staging
```

### GitLab CI Example

```yaml
deploy:staging:
  script:
    - cd scripts
    - chmod +x deploy-staging.sh
    - ./deploy-staging.sh
    - chmod +x smoke-tests.sh
    - ./smoke-tests.sh staging
```

---

## Best Practices

1. **Always run smoke tests** after deployment
2. **Verify deployment** before marking as complete
3. **Monitor logs** during and after deployment
4. **Have rollback plan ready** before deploying
5. **Test in staging** before deploying to production
6. **Document any issues** encountered during deployment
7. **Keep scripts updated** with infrastructure changes

---

## Contributing

When adding new scripts:

1. Follow existing naming conventions
2. Add comprehensive error handling
3. Include usage documentation in script header
4. Update this README with script details
5. Make script executable: `chmod +x script-name.sh`
6. Test script thoroughly before committing

---

## Support

For issues with deployment scripts:

1. Check script output for error messages
2. Review logs: `kubectl logs -f deployment/<name> -n password-manager`
3. Check [Troubleshooting Guide](../docs/CICD_TROUBLESHOOTING.md)
4. Contact DevOps team

---

## Related Documentation

- [Staging Deployment Guide](../docs/STAGING_DEPLOYMENT_GUIDE.md)
- [Terraform Deployment Guide](../terraform/DEPLOYMENT_GUIDE.md)
- [Kubernetes Deployment Documentation](../k8s/DEPLOYMENT.md)
- [CI/CD Pipeline Documentation](../docs/CICD_PIPELINE.md)

---

**Last Updated:** 2024-01-XX  
**Maintained By:** DevOps Team
