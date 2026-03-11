pipeline {
    agent any
    
    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main', url: 'https://github.com/tej-as-kamble/Dimension.git'
            }
        }
        
        stage('Inject Env Files') {
            steps {
                withCredentials([
                    file(credentialsId: 'dimension-root-env-file', variable: 'ROOT_ENV'),
                    file(credentialsId: 'dimension-backend-env-file', variable: 'BACKEND_ENV'),
                ]) {
                    sh 'cp -f "$ROOT_ENV" .env'
                    sh 'cp -f "$BACKEND_ENV" backend/.env'
                }
            }
        }

        stage('Run Tests') {
            parallel {
                stage('Test Frontend') {
                    steps {
                        dir('frontend') {
                            sh 'docker run --rm -v "$(pwd)":/app -w /app node:20-alpine sh -c "npm ci && npm test"'
                        }
                    }
                }
                
                stage('Test Backend') {
                    steps {
                        dir('backend') {
                            sh 'docker run --rm -v "$(pwd)":/app -w /app node:20-alpine sh -c "npm ci && npm test"'
                        }
                    }
                }
            }
        }
        
        stage('Docker Build & Run') {
            steps {
                sh 'docker rm -f dimension_backend || true'
                sh 'docker rm -f dimension_frontend || true'
                
                sh 'docker-compose down'
                sh 'docker-compose up -d --build'
            }
        }
    }
}