import * as cdk from '@aws-cdk/core';
import { Artifact } from '@aws-cdk/aws-codepipeline';
import { Build } from './resources/build';
import { Iam } from './resources/iam';
import { Pipeline } from './resources/pipeline';
import { Props } from './props';
import { PipelineProject } from '@aws-cdk/aws-codebuild';

interface IDeliveryResources {
}
export class DeliveryResources extends cdk.Construct implements IDeliveryResources {
  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id);

    const iam = new Iam(this);
    const pipelineRole = iam.createPipelineRole({
      projectName: props.projectName, managedPolicies: props.role?.pipeline?.managedPolicies || [], inlinePolicies: props.role?.pipeline?.inlinePolicies || [],
    })
    const buildRole = iam.createBuildRole({
      projectName: props.projectName, managedPolicies: props.role?.build?.managedPolicies || [], inlinePolicies: props.role?.build?.inlinePolicies || [],
    })

    const build = new Build(this);
    let buildProject!: PipelineProject;
    if (props.github.branch !== undefined) {
      buildProject = build.createBuildProject({
        projectName: props.projectName, vpc: props.vpc, securityGroups: (props.securityGroups || []),
        build: { buildDir: props.build.buildDir || '.', buildRole: buildRole, cacheBucket: props.build.cacheBucket, containerName: props.build.containerName },
        credentialArn: props.credentialArn,
      });
    }
    let releaseProject!: PipelineProject;
    if (props.principal !== undefined) {
      releaseProject = build.createBridgeProject({
        projectName: props.projectName, vpc: props.vpc, securityGroups: (props.securityGroups || []),
        build: { buildRole: buildRole, cacheBucket: props.build.cacheBucket, containerName: props.build.containerName },
        github: { owner: props.github.owner, repository: props.github.repository, version: props.github.version },
        credentialArn: props.credentialArn,
      });
    }
    let bridgeProject!: PipelineProject;
    if (props.github.branch === undefined) {
      bridgeProject = build.createBridgeProject({
        projectName: props.projectName, vpc: props.vpc, securityGroups: (props.securityGroups || []),
        build: { buildRole: buildRole, cacheBucket: props.build.cacheBucket, containerName: props.build.containerName },
        github: { owner: props.github.owner, repository: props.github.repository, version: props.github.version },
        credentialArn: props.credentialArn,
      });
    }

    let sourceArtifact = props.artifact.outputs?.source || new Artifact();
    let buildArtifact = props.artifact.outputs?.build || new Artifact();

    const pipeline = new Pipeline(this);
    const pl = pipeline.createCodePipeline({ projectName: props.projectName, artifact: { bucket: props.artifact.bucket }, role: pipelineRole });

    let sourceAction;
    if (props.github.codestarArn && props.github.codestarArn.length !== 0) {
      sourceAction = pipeline.getCodeStarConnectionsSourceAction({
        github: { codestarArn: props.github.codestarArn, owner: props.github.owner, repository: props.github.repository, branch: props.github.branch! },
        artifact: { output: props.artifact.outputs?.build || new Artifact() },
      });
    } else if (props.github.branch && props.github.branch.length !== 0) {
      sourceAction = pipeline.getGitHubSourceAction({
        projectName: props.projectName, github: { owner: props.github.owner, repository: props.github.repository, branch: props.github.branch! },
        artifact: { output: props.artifact.outputs?.build || new Artifact() }, credentialArn: props.credentialArn,
      });
    } else {
      sourceAction = pipeline.getEcrSourceAction({
        projectName: props.projectName, github: { version: props.github.version },
        artifact: { output: props.artifact.outputs?.build || new Artifact() },
      });
      pipeline.addTrigger({ projectName: props.projectName, pipeline: pl, github: { version: props.github.version } });
    }
    pipeline.addStage({ pipeline: pl, stages: [{ stageName: 'SourceStage', actions: [sourceAction] }] });
    pipeline.addStage({ pipeline: pl, stages: props.stages?.initialize || [] });

    if (buildProject !== undefined) {
      pipeline.addStage({ pipeline: pl, stages: [{ stageName: 'BuildStage', actions: pipeline.getActions({ projects: [buildProject], artifact: { input: sourceArtifact, outputs: [buildArtifact] } }) }] });
    } else if (bridgeProject !== undefined) {
      pipeline.addStage({ pipeline: pl, stages: [{ stageName: 'BridgeStage', actions: pipeline.getActions({ projects: [bridgeProject], artifact: { input: sourceArtifact, outputs: [buildArtifact] } }) }] });
    }

    pipeline.addStage({ pipeline: pl, stages: props.stages?.build || [] });
    pipeline.addDeployStage({ pipeline: pl, service: props.service, role: pipelineRole, artifact: { input: buildArtifact } });
    pipeline.addStage({ pipeline: pl, stages: props.stages?.deploy || [] });
    pipeline.addStage({ pipeline: pl, stages: props.stages?.finalize || [] });

    if (releaseProject !== undefined) {
      pipeline.addApprovalStage({ pipeline: pl });
      pipeline.addStage({ pipeline: pl, stages: [{ stageName: 'ReleaseStage', actions: pipeline.getActions({ projects: [releaseProject], artifact: { input: sourceArtifact, outputs: [] } }) }] });
    }
  }
}
