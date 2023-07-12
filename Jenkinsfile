pipeline {
    agent {
        label 'EC2Slave-docker'
        
    }
    
    environment {
        imageName = "696083720229.dkr.ecr.us-east-1.amazonaws.com/myapp-stage:${BUILD_NUMBER}"
	containerName = "nodejsapp"
        GITHUB_URL = "https://github.com/divyabilson/myapp-test4"
	    
	REGION = "us-east-1"
      	REPOSITORY = "myapp-stage"
      	ECR_REGISTRY = "696083720229.dkr.ecr.us-east-1.amazonaws.com"
      	NEW_DOCKER_IMAGE="696083720229.dkr.ecr.us-east-1.amazonaws.com/myapp-stage:${BUILD_NUMBER}"
	SERVICENAME = "myapp-stage"
    	TASKFAMILY = "myapp-stage"
    	CLUSTERNAME = "myapp-stage"
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
				sh 'docker stop $containerName || true && docker rm -f $containerName || true'
                		sh 'docker run -p 80:3000 -d --name $containerName $imageName'
				sh 'sudo apt install -y jq && jq --version' 
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
					NEW_IMAGE="${ECR_REGISTRY}/${REPOSITORY}:${BUILD_NUMBER}"
					TASK_DEFINITION="aws ecs describe-task-definition --task-definition "$TASKFAMILY" --region "$REGION""
  					NEW_TASK_DEFINITION=$($TASK_DEFINITION | jq -r --arg IMAGE "$NEW_IMAGE" '.taskDefinition | .containerDefinitions[0].image = $IMAGE | del(.taskDefinitionArn) | del(.revision) | del(.status) | del(.requiresAttributes) | del(.compatibilities) | del(.registeredAt) | del(.registeredBy)')
					NEW_REVISION=$(aws ecs register-task-definition --region "$REGION" --cli-input-json "$NEW_TASK_DEFINITION")
					NEW_REVISION_DATA=$(echo $NEW_REVISION | jq '.taskDefinition.revision')
  					echo "Updating the service with new TD"
					aws ecs update-service --cluster $CLUSTERNAME --service $SERVICENAME --task-definition ${TASKFAMILY}:${NEW_REVISION_DATA} --force-new-deployment

   					echo "Cleaning the Images"
                			docker image prune -a
					echo "done"
					echo "${TASKFAMILY}, Revision: ${NEW_REVISION_DATA}"
				'''
			}
		}
		stage('Deployment Status') {
			steps {
				script {
				sh """
    				echo "Validating the Deployment status"
				sleep 90
                		export AWS_PROFILE=iamuser && aws ecs wait services-stable --cluster "${CLUSTERNAME}" --service "${SERVICENAME}" --region $REGION
                		"""
				}
			}
		}
	}
}
