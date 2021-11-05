import * as cdk from '@aws-cdk/core';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as sm from '@aws-cdk/aws-secretsmanager';
import { IRole } from '@aws-cdk/aws-iam';
import { IBucket } from '@aws-cdk/aws-s3';
import { Repository } from '@aws-cdk/aws-ecr'
import { PipelineProject } from '@aws-cdk/aws-codebuild';
import { IAction } from '@aws-cdk/aws-codepipeline';
import { CodeBuildAction, EcrSourceAction, EcsDeployAction, GitHubSourceAction, ManualApprovalAction } from '@aws-cdk/aws-codepipeline-actions';
import { Resource } from '../resource';
import { IBaseService } from '@aws-cdk/aws-ecs';

interface Props {
  projectName: string
  artifactBucket: IBucket
  credentialArn: string
  github: {
    owner: string
    repository: string
    branch?: string
    version: string
  }
  stages: {
    initialize: {
      stageName: string
      projects: PipelineProject[]
    }[]
    build: {
      stageName: string
      projects: PipelineProject[]
    }[]
    deploy: {
      stageName: string
      projects: PipelineProject[]
    }[]
    finalize: {
      stageName: string
      projects: PipelineProject[]
    }[]
  }
  deploy: {
    service: IBaseService
    role: IRole
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
    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();

    const pipeline = new codepipeline.Pipeline(this.scope, `Pipeline-${props.projectName}`, {
      pipelineName: props.projectName,
      artifactBucket: props.artifactBucket,
      crossAccountKeys: false,
      restartExecutionOnUpdate: false,
      role: props.deploy.role,
    });

    if (props.github.branch !== undefined) {
      pipeline.addStage({
        stageName: 'SourceStage',
        actions: [this.getSourceActions(props, { output: sourceOutput })],
      });
    } else {
      pipeline.addStage({
        stageName: 'SourceStage',
        actions: [this.getEcrSourceAction(props, { output: sourceOutput })],
      });
    }

    props.stages.initialize.forEach(stage => {
      pipeline.addStage({
        stageName: stage.stageName,
        actions: this.getActions(stage.projects, { input: sourceOutput, outputs: [] }),
      });
    });

    if (0 < props.provisioning.build.length) {
      pipeline.addStage({
        stageName: 'BuildStage',
        actions: this.getActions(props.provisioning.build, { input: sourceOutput, outputs: [buildOutput] }),
      })
    }

    if (0 < props.provisioning.bridge.length) {
      pipeline.addStage({
        stageName: 'BridgeStage',
        actions: this.getActions(props.provisioning.bridge, { input: sourceOutput, outputs: [buildOutput] }),
      })
    }

    props.stages.build.forEach(stage => {
      pipeline.addStage({
        stageName: stage.stageName,
        actions: this.getActions(stage.projects, { input: sourceOutput, outputs: [] }),
      });
    });

    pipeline.addStage({
      stageName: 'DeployStage',
      actions: [new EcsDeployAction({ actionName: 'EcsDeployAction', service: props.deploy.service, role: props.deploy.role, input: buildOutput })]
    });

    props.stages.deploy.forEach(stage => {
      pipeline.addStage({
        stageName: stage.stageName,
        actions: this.getActions(stage.projects, { input: sourceOutput, outputs: [] }),
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
        actions: this.getActions(stage.projects, { input: sourceOutput, outputs: [] }),
      });
    });

    if (0 < props.provisioning.release.length) {
      pipeline.addStage({
        stageName: 'ReleaseStage',
        actions: this.getActions(props.provisioning.release, { input: sourceOutput, outputs: [] }),
      })
    }
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
      imageTag: 'latest',
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
