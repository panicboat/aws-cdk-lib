import * as cdk from '@aws-cdk/core';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as sm from '@aws-cdk/aws-secretsmanager';
import { IRole } from '@aws-cdk/aws-iam';
import { IBucket } from '@aws-cdk/aws-s3';
import { Repository } from '@aws-cdk/aws-ecr'
import { Rule } from '@aws-cdk/aws-events';
import { CodePipeline } from '@aws-cdk/aws-events-targets'
import { PipelineProject } from '@aws-cdk/aws-codebuild';
import { IAction } from '@aws-cdk/aws-codepipeline';
import { CodeBuildAction, CodeStarConnectionsSourceAction, EcrSourceAction, EcsDeployAction, GitHubSourceAction, ManualApprovalAction } from '@aws-cdk/aws-codepipeline-actions';
import { Resource } from '../resource';
import { IBaseService } from '@aws-cdk/aws-ecs';

interface Props {
  projectName: string
  credentialArn: string
  github: {
    codestarArn?: string
    owner: string
    repository: string
    branch?: string
    version: string
  }
  stages: {
    initialize: {
      stageName: string
      actions: IAction[]
    }[]
    build: {
      stageName: string
      actions: IAction[]
    }[]
    deploy: {
      stageName: string
      actions: IAction[]
    }[]
    finalize: {
      stageName: string
      actions: IAction[]
    }[]
  }
  deploy: {
    service: IBaseService
    role: IRole
    artifact: {
      bucket: IBucket
      outputs: {
        source: codepipeline.Artifact
        build: codepipeline.Artifact
      }
    }
  }
  provisioning: {
    build: PipelineProject[]
    release: PipelineProject[]
    bridge: PipelineProject[]
  }
}
interface IPipeline {
  createResources(props: Props): void;
}
export class Pipeline extends Resource implements IPipeline {
  public createResources(props: Props): void {
    this.createPipeline(props);
  }

  private createPipeline(props: Props): void {
    const pipeline = new codepipeline.Pipeline(this.scope, `Pipeline-${props.projectName}`, {
      pipelineName: props.projectName,
      artifactBucket: props.deploy.artifact.bucket,
      crossAccountKeys: false,
      restartExecutionOnUpdate: false,
      role: props.deploy.role,
    });

    if (0 < (props.github.codestarArn || '').length) {
      pipeline.addStage({
        stageName: 'SourceStage',
        actions: [this.getCodeStarConnectionsSourceAction(props, { output: props.deploy.artifact.outputs.source })],
      });
    } else if (0 < (props.github.branch || '').length) {
      pipeline.addStage({
        stageName: 'SourceStage',
        actions: [this.getSourceActions(props, { output: props.deploy.artifact.outputs.source })],
      });
    } else {
      pipeline.addStage({
        stageName: 'SourceStage',
        actions: [this.getEcrSourceAction(props, { output: props.deploy.artifact.outputs.source })],
      });
      new Rule(this.scope, `EcrSourceActionRule-${props.projectName}`, {
        eventPattern: {
          source: ['aws.ecr'],
          detail: {
            'action-type': ['PUSH'],
            'image-tag': [props.github.repository],
            'repository-name': [props.projectName],
            result: ['SUCCESS'],
          },
        },
        targets: [new CodePipeline(pipeline)],
      });
    }

    props.stages.initialize.forEach(stage => {
      pipeline.addStage({
        stageName: stage.stageName,
        actions: stage.actions,
      });
    });

    if (0 < props.provisioning.build.length) {
      pipeline.addStage({
        stageName: 'BuildStage',
        actions: this.getActions(props.provisioning.build, { input: props.deploy.artifact.outputs.source, outputs: [props.deploy.artifact.outputs.build] }),
      })
    }

    if (0 < props.provisioning.bridge.length) {
      pipeline.addStage({
        stageName: 'BridgeStage',
        actions: this.getActions(props.provisioning.bridge, { input: props.deploy.artifact.outputs.source, outputs: [props.deploy.artifact.outputs.build] }),
      })
    }

    props.stages.build.forEach(stage => {
      pipeline.addStage({
        stageName: stage.stageName,
        actions: stage.actions,
      });
    });

    pipeline.addStage({
      stageName: 'DeployStage',
      actions: [new EcsDeployAction({ actionName: 'EcsDeployAction', service: props.deploy.service, role: props.deploy.role, input: props.deploy.artifact.outputs.build })]
    });

    props.stages.deploy.forEach(stage => {
      pipeline.addStage({
        stageName: stage.stageName,
        actions: stage.actions,
      });
    });

    if (0 < props.provisioning.release.length) {
      pipeline.addStage({
        stageName: 'ApprovalStage',
        actions: [new ManualApprovalAction({ actionName: `ManualApprovalAction` })]
      });
    }

    props.stages.finalize.forEach(stage => {
      pipeline.addStage({
        stageName: stage.stageName,
        actions: stage.actions,
      });
    });

    if (0 < props.provisioning.release.length) {
      pipeline.addStage({
        stageName: 'ReleaseStage',
        actions: this.getActions(props.provisioning.release, { input: props.deploy.artifact.outputs.source, outputs: [] }),
      })
    }
  }

  private getCodeStarConnectionsSourceAction(props: Props, artifact: { output: codepipeline.Artifact }) {
    return new CodeStarConnectionsSourceAction({
      actionName: 'CodeStarConnectionsSourceAction',
      connectionArn: props.github.codestarArn!,
      owner: props.github.owner,
      repo: props.github.repository,
      branch: props.github.branch,
      output: artifact.output,
    });
  }

  private getSourceActions(props: Props, artifact: { output: codepipeline.Artifact }) {
    return new GitHubSourceAction({
      actionName: 'GitHubSourceAction',
      owner: props.github.owner,
      oauthToken: this.getGitHubAccessToken(props),
      repo: props.github.repository,
      branch: props.github.branch,
      output: artifact.output,
    });
  }

  private getEcrSourceAction(props: Props, artifact: { output: codepipeline.Artifact }) {
    const repository = Repository.fromRepositoryArn(this.scope, `SourceRepository-${props.projectName}`, `arn:aws:ecr:${this.stack.region}:${this.stack.account}:repository/${props.projectName}`)
    return new EcrSourceAction({
      actionName: 'EcrSourceAction',
      repository: repository,
      imageTag: props.github.version,
      output: artifact.output,
    });
  }

  private getActions(projects: PipelineProject[], artifact: { input: codepipeline.Artifact, outputs: codepipeline.Artifact[] }): IAction[] {
    const actions: IAction[] = [];
    projects.forEach((project, index) => {
      actions.push(new CodeBuildAction({
        actionName: `CodeBuildAction${index+1}`,
        project: project,
        input: artifact.input,
        outputs: artifact.outputs,
      }));
    });
    return actions;
  }

  private getGitHubAccessToken(props: Props) {
    const secret = sm.Secret.fromSecretAttributes(this.scope, `CiCredentialArn-${props.projectName}`, {
      secretCompleteArn: props.credentialArn
    });
    return secret.secretValueFromJson('GitHubAccessToken')
  }
}
