#!/bin/bash

# ============================================
# Docker Image Build Script
# Builds optimized Docker images for backend and frontend
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VERSION="${VERSION:-latest}"
REGISTRY="${REGISTRY:-ghcr.io}"
REPOSITORY="${REPOSITORY:-password-manager}"
BUILD_BACKEND="${BUILD_BACKEND:-true}"
BUILD_FRONTEND="${BUILD_FRONTEND:-true}"
PUSH_IMAGES="${PUSH_IMAGES:-false}"
PLATFORM="${PLATFORM:-linux/amd64,linux/arm64}"

# Function to print colored messages
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Function to build backend image
build_backend() {
    print_info "Building backend image..."
    
    cd backend
    
    # Build the image
    docker build \
        --tag "${REGISTRY}/${REPOSITORY}-backend:${VERSION}" \
        --tag "${REGISTRY}/${REPOSITORY}-backend:latest" \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        --file Dockerfile \
        .
    
    cd ..
    
    print_success "Backend image built successfully"
    
    # Display image size
    IMAGE_SIZE=$(docker images "${REGISTRY}/${REPOSITORY}-backend:${VERSION}" --format "{{.Size}}")
    print_info "Backend image size: ${IMAGE_SIZE}"
}

# Function to build frontend image
build_frontend() {
    print_info "Building frontend image..."
    
    cd frontend
    
    # Build the image
    docker build \
        --tag "${REGISTRY}/${REPOSITORY}-frontend:${VERSION}" \
        --tag "${REGISTRY}/${REPOSITORY}-frontend:latest" \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        --file Dockerfile \
        .
    
    cd ..
    
    print_success "Frontend image built successfully"
    
    # Display image size
    IMAGE_SIZE=$(docker images "${REGISTRY}/${REPOSITORY}-frontend:${VERSION}" --format "{{.Size}}")
    print_info "Frontend image size: ${IMAGE_SIZE}"
}

# Function to push images to registry
push_images() {
    if [ "$PUSH_IMAGES" = "true" ]; then
        print_info "Pushing images to registry..."
        
        if [ "$BUILD_BACKEND" = "true" ]; then
            docker push "${REGISTRY}/${REPOSITORY}-backend:${VERSION}"
            docker push "${REGISTRY}/${REPOSITORY}-backend:latest"
            print_success "Backend image pushed"
        fi
        
        if [ "$BUILD_FRONTEND" = "true" ]; then
            docker push "${REGISTRY}/${REPOSITORY}-frontend:${VERSION}"
            docker push "${REGISTRY}/${REPOSITORY}-frontend:latest"
            print_success "Frontend image pushed"
        fi
    else
        print_warning "Skipping image push (set PUSH_IMAGES=true to enable)"
    fi
}

# Function to test images
test_images() {
    print_info "Testing images..."
    
    if [ "$BUILD_BACKEND" = "true" ]; then
        print_info "Testing backend image..."
        docker run --rm "${REGISTRY}/${REPOSITORY}-backend:${VERSION}" java -version
        print_success "Backend image test passed"
    fi
    
    if [ "$BUILD_FRONTEND" = "true" ]; then
        print_info "Testing frontend image..."
        docker run --rm "${REGISTRY}/${REPOSITORY}-frontend:${VERSION}" node --version
        print_success "Frontend image test passed"
    fi
}

# Function to display usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Build Docker images for Password Manager application

OPTIONS:
    -v, --version VERSION       Set image version (default: latest)
    -r, --registry REGISTRY     Set container registry (default: ghcr.io)
    -n, --repository NAME       Set repository name (default: password-manager)
    -b, --backend-only          Build only backend image
    -f, --frontend-only         Build only frontend image
    -p, --push                  Push images to registry after build
    -t, --test                  Test images after build
    -h, --help                  Display this help message

EXAMPLES:
    # Build all images with default settings
    $0

    # Build and push images with version tag
    $0 --version v1.0.0 --push

    # Build only backend image
    $0 --backend-only

    # Build with custom registry
    $0 --registry docker.io --repository myuser/password-manager

ENVIRONMENT VARIABLES:
    VERSION         Image version tag
    REGISTRY        Container registry URL
    REPOSITORY      Repository name
    BUILD_BACKEND   Build backend image (true/false)
    BUILD_FRONTEND  Build frontend image (true/false)
    PUSH_IMAGES     Push images after build (true/false)

EOF
}

# Parse command line arguments
TEST_IMAGES=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -r|--registry)
            REGISTRY="$2"
            shift 2
            ;;
        -n|--repository)
            REPOSITORY="$2"
            shift 2
            ;;
        -b|--backend-only)
            BUILD_BACKEND=true
            BUILD_FRONTEND=false
            shift
            ;;
        -f|--frontend-only)
            BUILD_BACKEND=false
            BUILD_FRONTEND=true
            shift
            ;;
        -p|--push)
            PUSH_IMAGES=true
            shift
            ;;
        -t|--test)
            TEST_IMAGES=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    print_info "Starting Docker image build process..."
    print_info "Version: ${VERSION}"
    print_info "Registry: ${REGISTRY}"
    print_info "Repository: ${REPOSITORY}"
    echo ""
    
    # Check Docker
    check_docker
    
    # Build images
    if [ "$BUILD_BACKEND" = "true" ]; then
        build_backend
    fi
    
    if [ "$BUILD_FRONTEND" = "true" ]; then
        build_frontend
    fi
    
    # Test images
    if [ "$TEST_IMAGES" = "true" ]; then
        test_images
    fi
    
    # Push images
    push_images
    
    echo ""
    print_success "Build process completed successfully!"
    
    # Display summary
    print_info "Built images:"
    if [ "$BUILD_BACKEND" = "true" ]; then
        echo "  - ${REGISTRY}/${REPOSITORY}-backend:${VERSION}"
    fi
    if [ "$BUILD_FRONTEND" = "true" ]; then
        echo "  - ${REGISTRY}/${REPOSITORY}-frontend:${VERSION}"
    fi
}

# Run main function
main
