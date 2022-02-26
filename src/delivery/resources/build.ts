import * as cdk from '@aws-cdk/core';
import * as codebuild from '@aws-cdk/aws-codebuild';
import { Resource } from '../resource';
import { BridgeProject, BuildProjectProps, ReleaseProjectProps } from '../props';

interface IBuild {
  createBuildProject(props: BuildProjectProps): codebuild.PipelineProject
  createReleaseProject(props: ReleaseProjectProps): codebuild.PipelineProject
  createBridgeProject(props: BridgeProject): codebuild.PipelineProject
}
export class Build extends Resource implements IBuild {

  public createBuildProject(props: BuildProjectProps) {
    return new codebuild.PipelineProject(this.scope, `BuildProject-${props.projectName}`, {
      projectName: `${props.projectName}-build`,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_4_0,
        computeType: codebuild.ComputeType.LARGE,
        privileged: true,
        environmentVariables: {
          'REPOSITORY_URI': {
            value: `${this.stack.account}.dkr.ecr.${this.stack.region}.amazonaws.com/${props.projectName}`,
          },
          'CONTAINER_NAME': {
            value: props.build.containerName,
          },
          'BUILD_DIR': {
            value: props.build.buildDir,
          },
        },
      },
      role: props.build.buildRole,
      timeout: cdk.Duration.minutes(30),
      vpc: props.vpc,
      subnetSelection: { subnets: props.vpc.privateSubnets },
      securityGroups: props.securityGroups,
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        env: {
          variables: {
            DOCKER_BUILDKIT: '1',
          },
          'secrets-manager': {
            GITHUB_TOKEN: `${props.credentialArn}:GitHubAccessToken`,
            DOCKERHUB_ID: `${props.credentialArn}:DockerHubID`,
            DOCKERHUB_PASSWORD: `${props.credentialArn}:DockerHubPassword`,
          },
        },
        phases: {
          pre_build: {
            commands: [
              'echo Logging in to DockerHub...',
              'docker login -u ${DOCKERHUB_ID} -p ${DOCKERHUB_PASSWORD}',
              'echo Logging in to Amazon ECR...',
              '$(aws ecr get-login --no-include-email --region $AWS_DEFAULT_REGION)',
              'COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)',
              'IMAGE_TAG=${COMMIT_HASH:=latest}',
            ],
          },
          build: {
            commands: [
              'echo Build started on `date`',
              'docker build -t $REPOSITORY_URI:latest $BUILD_DIR --build-arg GITHUB_TOKEN=$GITHUB_TOKEN',
              'docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG',
            ],
          },
          post_build: {
            commands: [
              'echo Build completed on `date`',
              'docker push $REPOSITORY_URI:latest',
              'docker push $REPOSITORY_URI:$IMAGE_TAG',
              'echo \"[{\\\"name\\\":\\\"${CONTAINER_NAME}\\\",\\\"imageUri\\\":\\\"${REPOSITORY_URI}:${IMAGE_TAG}\\\"}]\" > imagedefinitions.json',
            ],
            finally: [],
          },
        },
        artifacts: {
          files: [
            'imagedefinitions.json',
          ]
        },
      }),
    });
  }

  public createReleaseProject(props: ReleaseProjectProps) {
    return new codebuild.PipelineProject(this.scope, `ReleaseProject-${props.projectName}`, {
      projectName: `${props.projectName}-release`,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_4_0,
        computeType: codebuild.ComputeType.SMALL,
        privileged: true,
        environmentVariables: {
          'REPOSITORY_URI': {
            value: `${this.stack.account}.dkr.ecr.${this.stack.region}.amazonaws.com/${props.projectName}`,
          },
          'GITHUB_OWNER': {
            value: props.github.owner,
          },
          'GITHUB_REPOSITORY': {
            value: props.github.repository,
          },
          'RELEASE_VERSION': {
            value: props.github.version,
          },
          'RELEASE_ACCOUNT_ID': {
            value: props.principal.account,
          },
          'RELEASE_REPOSITORY_URI': {
            value: props.principal.repository,
          },
        },
      },
      role: props.build.buildRole,
      timeout: cdk.Duration.minutes(30),
      vpc: props.vpc,
      subnetSelection: { subnets: props.vpc.privateSubnets },
      securityGroups: props.securityGroups,
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        env: {
          variables: {
            DOCKER_BUILDKIT: '1',
          },
          'secrets-manager': {
            GITHUB_TOKEN: `${props.credentialArn}:GitHubAccessToken`,
            DOCKERHUB_ID: `${props.credentialArn}:DockerHubID`,
            DOCKERHUB_PASSWORD: `${props.credentialArn}:DockerHubPassword`,
          },
        },
        phases: {
          pre_build: {
            commands: [
              'echo Logging in to Amazon ECR...',
              '$(aws ecr get-login --no-include-email --region $AWS_DEFAULT_REGION)',
              'COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)',
              'IMAGE_TAG=${COMMIT_HASH:=latest}',
            ],
            finally: [
              'apt-get install -y tzdata',
              'ln -sf /usr/share/zoneinfo/Asia/Tokyo /etc/localtime',
              'released=`date "+%Y%m%d%H%M"`',
              'RELEASE_TAG=${RELEASE_VERSION}.$released',
            ]
          },
          build: {
            commands: [
              'authorization="Authorization:token $GITHUB_TOKEN"',
              'content_type="Content-Type:application/json"',
              'release_tag=${RELEASE_TAG}',
              'release_name=${RELEASE_TAG}',
              'description=""',
              'params=\"{\\\"tag_name\\\":\\\"$release_tag\\\",\\\"target_commitish\\\":\\\"$CODEBUILD_RESOLVED_SOURCE_VERSION\\\",\\\"name\\\":\\\"$release_name\\\",\\\"body\\\":\\\"$description\\\",\\\"draft\\\":false,\\\"prerelease\\\":false}\"',
              'curl -X POST -H \"$authorization\" -H \"$content_type\" -d \"$params\" https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPOSITORY}/releases',
            ],
            finally: [
              'docker pull $REPOSITORY_URI:$IMAGE_TAG',
              'docker tag  $REPOSITORY_URI:$IMAGE_TAG $REPOSITORY_URI:$RELEASE_VERSION',
              'docker tag  $REPOSITORY_URI:$IMAGE_TAG $REPOSITORY_URI:$RELEASE_TAG',
              'docker push $REPOSITORY_URI:$RELEASE_VERSION',
              'docker push $REPOSITORY_URI:$RELEASE_TAG',
            ]
          },
          post_build: {
            commands: [
              'docker tag  $REPOSITORY_URI:$RELEASE_VERSION $RELEASE_REPOSITORY_URI:$RELEASE_VERSION',
              'docker tag  $REPOSITORY_URI:$RELEASE_TAG $RELEASE_REPOSITORY_URI:$RELEASE_TAG',
              'docker push $RELEASE_REPOSITORY_URI:$RELEASE_VERSION',
              'docker push $RELEASE_REPOSITORY_URI:$RELEASE_TAG',
            ],
            finally: [],
          },
        },
      }),
    });
  }

  public createBridgeProject(props: BridgeProject) {
    return new codebuild.PipelineProject(this.scope, `BridgeProject-${props.projectName}`, {
      projectName: `${props.projectName}-bridge`,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_4_0,
        computeType: codebuild.ComputeType.SMALL,
        privileged: true,
        environmentVariables: {
          'REPOSITORY_URI': {
            value: `${this.stack.account}.dkr.ecr.${this.stack.region}.amazonaws.com/${props.projectName}`,
          },
          'CONTAINER_NAME': {
            value: props.build.containerName,
          },
          'GITHUB_OWNER': {
            value: props.github.owner,
          },
          'GITHUB_REPOSITORY': {
            value: props.github.repository,
          },
          'RELEASE_VERSION': {
            value: props.github.version,
          },
        },
      },
      role: props.build.buildRole,
      timeout: cdk.Duration.minutes(30),
      vpc: props.vpc,
      subnetSelection: { subnets: props.vpc.privateSubnets },
      securityGroups: props.securityGroups,
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        env: {
          variables: {
            DOCKER_BUILDKIT: '1',
          },
          'secrets-manager': {
            GITHUB_TOKEN: `${props.credentialArn}:GitHubAccessToken`,
            DOCKERHUB_ID: `${props.credentialArn}:DockerHubID`,
            DOCKERHUB_PASSWORD: `${props.credentialArn}:DockerHubPassword`,
          },
        },
        phases: {
          pre_build: {
            commands: [
              'echo Logging in to Amazon ECR...',
              '$(aws ecr get-login --region $AWS_DEFAULT_REGION --no-include-email)',
              'IMAGE_TAG=`curl -X GET -H \"Authorization:token ${GITHUB_TOKEN}\" https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPOSITORY}/releases | jq -r \'. | select(.[0].tag_name | startswith(\"\'$RELEASE_VERSION\'\"))\' | jq -r .[0].tag_name`',
            ],
            finally: [],
          },
          build: {
            commands: [],
            finally: [],
          },
          post_build: {
            commands: [
              'echo Writing image definitions file...',
              'echo \"[{\\\"name\\\":\\\"${CONTAINER_NAME}\\\",\\\"imageUri\\\":\\\"${REPOSITORY_URI}:${IMAGE_TAG}\\\"}]\" > imagedefinitions.json',
            ],
            finally: [],
          },
        },
        artifacts: {
          files: [
            'imagedefinitions.json',
          ]
        },
      }),
    });
  }
}
