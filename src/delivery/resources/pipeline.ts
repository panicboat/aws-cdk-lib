import * as cdk from '@aws-cdk/core';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as sm from '@aws-cdk/aws-secretsmanager';
import { Repository } from '@aws-cdk/aws-ecr'
import { Rule } from '@aws-cdk/aws-events';
import { CodePipeline } from '@aws-cdk/aws-events-targets'
import { IAction } from '@aws-cdk/aws-codepipeline';
import { CodeBuildAction, CodeStarConnectionsSourceAction, EcrSourceAction, EcsDeployAction, GitHubSourceAction, ManualApprovalAction } from '@aws-cdk/aws-codepipeline-actions';
import { Resource } from '../resource';
import { CodePipelineProps, CodeStarConnectionSourceActionProps, EcrSourceActionProps, GitHubSourceActionProps, PipelineActionProps, PipelineApprovalStageStageProps, PipelineDeployStageStageProps, PipelineStageProps, PipelineTriggerProps } from '../props';

interface IPipeline {
  createCodePipeline(props: CodePipelineProps): codepipeline.Pipeline;
  getCodeStarConnectionsSourceAction(props: CodeStarConnectionSourceActionProps): CodeStarConnectionsSourceAction;
  getGitHubSourceAction(props: GitHubSourceActionProps): GitHubSourceAction;
  getEcrSourceAction(props: EcrSourceActionProps): EcrSourceAction;
  addStage(props: PipelineStageProps): void;
  addTrigger(props: PipelineTriggerProps): void;
  getActions(props: PipelineActionProps): codepipeline.IAction[];
}
export class Pipeline extends Resource implements IPipeline {
  pipeline(arg0: { projects: import("@aws-cdk/aws-codebuild").PipelineProject[]; artifact: { outputs: codepipeline.Artifact[]; }; }): codepipeline.IAction {
    throw new Error('Method not implemented.');
  }

  public createCodePipeline(props: CodePipelineProps) {
    return new codepipeline.Pipeline(this.scope, `Pipeline-${props.projectName}`, {
      pipelineName: props.projectName,
      artifactBucket: props.artifact.bucket,
      crossAccountKeys: false,
      restartExecutionOnUpdate: false,
      role: props.role,
    });
  }

  public getCodeStarConnectionsSourceAction(props: CodeStarConnectionSourceActionProps) {
    return new CodeStarConnectionsSourceAction({
      actionName: 'CodeStarConnectionsSourceAction',
      connectionArn: props.github.codestarArn!,
      owner: props.github.owner,
      repo: props.github.repository,
      branch: props.github.branch,
      output: props.artifact.output,
    });
  }

  public getGitHubSourceAction(props: GitHubSourceActionProps) {
    const secret = sm.Secret.fromSecretAttributes(this.scope, `CiCredentialArn-${props.projectName}`, {
      secretCompleteArn: props.credentialArn
    });
    return new GitHubSourceAction({
      actionName: 'GitHubSourceAction',
      owner: props.github.owner,
      oauthToken: secret.secretValueFromJson('GitHubAccessToken'),
      repo: props.github.repository,
      branch: props.github.branch,
      output: props.artifact.output,
    });
  }

  public getEcrSourceAction(props: EcrSourceActionProps) {
    const repository = Repository.fromRepositoryArn(this.scope, `SourceRepository-${props.projectName}`, `arn:aws:ecr:${this.stack.region}:${this.stack.account}:repository/${props.projectName}`)
    return new EcrSourceAction({
      actionName: 'EcrSourceAction',
      repository: repository,
      imageTag: props.github.version,
      output: props.artifact.output,
    });
  }

  public addDeployStage(props: PipelineDeployStageStageProps) {
    props.pipeline.addStage({
      stageName: 'DeployStage',
      actions: [new EcsDeployAction({ actionName: 'EcsDeployAction', service: props.service, role: props.role, input: props.artifact.input })]
    });
  }

  public addApprovalStage(props: PipelineApprovalStageStageProps) {
    props.pipeline.addStage({
      stageName: 'ApprovalStage',
      actions: [new ManualApprovalAction({ actionName: `ManualApprovalAction` })]
    });
  }

  public addStage(props: PipelineStageProps) {
    props.stages.forEach(stage => {
      props.pipeline.addStage({
        stageName: stage.stageName,
        actions: stage.actions,
      });
    });
  }

  public addTrigger(props: PipelineTriggerProps) {
    new Rule(this.scope, `EcrSourceActionRule-${props.projectName}`, {
      eventPattern: {
        source: ['aws.ecr'],
        detail: {
          'action-type': ['PUSH'],
          'image-tag': [props.github.version],
          'repository-name': [`${this.stack.account}.dkr.ecr.${this.stack.region}.amazonaws.com/${props.projectName}`],
          result: ['SUCCESS'],
        },
      },
      targets: [new CodePipeline(props.pipeline)],
    });
  }

  public getActions(props: PipelineActionProps) {
    const actions: IAction[] = [];
    props.projects.forEach((project, index) => {
      actions.push(new CodeBuildAction({
        actionName: `CodeBuildAction${index+1}`,
        project: project,
        input: props.artifact.input,
        outputs: props.artifact.outputs,
      }));
    });
    return actions;
  }
}
