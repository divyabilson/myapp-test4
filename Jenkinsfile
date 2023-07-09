pipeline {
    agent {
        label 'EC2Slave-docker'
        
    }
    
    environment {
        imageName = "divyabilson/nodejsapp2-repo:${BUILD_NUMBER}"
        containerName = "nodetest2"
        DOCKERHUB_CREDENTIALS = credentials('dockerhub')
        GITHUB_URL = "https://github.com/divyabilson/myapp-test4"
        APP_SERVER_IP = "54.227.89.75"
        USERNAME = "ubuntu"
        AWS_KEY_ID = "web_server_1"
      
      REGION = "us-east-1"
      REPOSITORY = "myapp-nodejs1"
      ECR_REGISTRY = "696083720229.dkr.ecr.us-east-1.amazonaws.com"
      NEW_DOCKER_IMAGE="${ECR_REGISTRY}/${REPOSITORY}:${BUILD_NUMBER}"
	SERVICENAME = "myapp-test4"
    	TASKFAMILY = "myapp-test4"
    	CLUSTERNAME = "myapp-test4"
      
      
        
    }

    tools {
        nodejs 'nodejs'
        
    }
    
    stages {
        stage('Cleanup') {
            steps {
                cleanWs()
                
            }
            
        }
        stage('Checkout source repo') {
      steps {
         checkout scm
      }
    }
        
        stage('Build') {
            steps {
                sh 'git clone $GITHUB_URL'
                sh 'docker system prune -af'
                sh 'docker build -t $imageName .'
              
                }
            
        }
        stage('Push Image to ECR') {
            steps {
              script {
                   sh '''
                      echo "Logging into ECR and Pushing the Image"
                      export AWS_PROFILE=iamuser
                      aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 696083720229.dkr.ecr.us-east-1.amazonaws.com
                      docker tag "${imageName}" ${ECR_REGISTRY}/${REPOSITORY}:${BUILD_NUMBER}
                      #eval "\$(aws ecr get-login --no-include-email --region ${REGION})"
                      docker push "${ECR_REGISTRY}/${REPOSITORY}:${BUILD_NUMBER}"
                    '''
               }
               
                
            }
            
        }
        stage('Deploy to ECS') {
            steps {
		sh '''
                echo "Creating new TD with the new Image"
                export AWS_PROFILE=iamuser
	        aws ecs describe-task-definition --task-definition ${TASKFAMILY} --region ${REGION} 
	        aws ecs describe-task-definition --task-definition ${TASKFAMILY} --region ${REGION} | jq --arg IMAGE ${NEW_DOCKER_IMAGE} '.taskDefinition | .containerDefinitions[0].image = \$IMAGE | del(.taskDefinitionArn) | del(.revision) | del(.status) | del(.requiresAttributes) | del(.compatibilities)') >> new_task          
	        aws ecs register-task-definition --region ${REGION} --cli-input-json new_task
                NEW_REVISION=aws ecs describe-task-definition --task-definition ${TASKFAMILY} --region ${REGION} | jq '.taskDefinition.revision')
                echo "Updating the service with new TD"
                aws ecs update-service --cluster ${CLUSTERNAME} --service ${SERVICENAME} --task-definition ${TASKFAMILY}:\$NEW_REVISION --region ${REGION}
	        echo "Cleaning the Images"
                docker rmi -f $NEW_DOCKER_IMAGE
                docker rmi -f "${APPS}/${GIT_BRANCH}:${BUILD_NUMBER}"               	    	    
                '''
         }
	}
        
                
                

        
    }
    post {
        always {
            sh 'docker logout'
            
        }
        
    }
    
}
