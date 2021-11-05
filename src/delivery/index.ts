import * as cdk from '@aws-cdk/core';
import { ISecurityGroup, IVpc } from '@aws-cdk/aws-ec2';
import { IBaseService } from '@aws-cdk/aws-ecs';
import { Artifact, IAction } from '@aws-cdk/aws-codepipeline';
import { IManagedPolicy, Policy } from '@aws-cdk/aws-iam';
import { IBucket } from '@aws-cdk/aws-s3';
import { Build } from './resources/build';
import { Iam } from './resources/iam';
import { Pipeline } from './resources/pipeline';

interface Props {
  projectName: string
  vpc: IVpc
  securityGroups?: ISecurityGroup[]
  credentialArn: string
  service: IBaseService
  build: {
    buildDir?: string
    cacheBucket: IBucket
    containerName: string
  }
  artifact: {
    bucket: IBucket
    outputs?: {
      source?: Artifact
      build?: Artifact
    }
  }
  github: {
    owner: string
    repository: string
    branch?: string
    version: string
  }
  stages?: {
    initialize?: {
      stageName: string
      actions: IAction[]
    }[]
    build?: {
      stageName: string
      actions: IAction[]
    }[]
    deploy?: {
      stageName: string
      actions: IAction[]
    }[]
    finalize?: {
      stageName: string
      actions: IAction[]
    }[]
  }
  role?: {
    pipeline?: {
      managedPolicies: IManagedPolicy[]
      inlinePolicies: Policy[]
    }
    build?: {
      managedPolicies: IManagedPolicy[]
      inlinePolicies: Policy[]
    }
  }
  principal?: {
    account: string
    repository: string
  }
}
interface IDeliveryResources {
}
export class DeliveryResources extends cdk.Construct implements IDeliveryResources {
  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id);

    let securityGroups = props.securityGroups || [];
    let buildDir = props.build.buildDir || '.';

    let defaultRole = { managedPolicies: [], inlinePolicies: [] };
    let pipelineRole = props.role !== undefined ? props.role.pipeline || defaultRole : defaultRole;
    let buildRole = props.role !== undefined ? props.role.build || defaultRole : defaultRole;

    let initializeStage = props.stages !== undefined ? props.stages.initialize || [] : [];
    let buildStage = props.stages !== undefined ? props.stages.build || [] : [];
    let deployStage = props.stages !== undefined ? props.stages.deploy || [] : [];
    let finalizeStage = props.stages !== undefined ? props.stages.finalize || [] : [];

    let sourceArtifact = props.artifact.outputs !== undefined ? props.artifact.outputs.source || new Artifact() : new Artifact();
    let buildArtifact = props.artifact.outputs !== undefined ? props.artifact.outputs.build || new Artifact() : new Artifact();

    const iam = new Iam(this);
    iam.createResources({ projectName: props.projectName, pipelineRole: pipelineRole, buildRole: buildRole });

    const build = new Build(this);
    build.createResources({
      projectName: props.projectName, vpc: props.vpc, securityGroups: securityGroups, credentialArn: props.credentialArn,
      build: { buildDir: buildDir, containerName: props.build.containerName, buildRole: iam.buildRole, cacheBucket: props.build.cacheBucket },
      github: props.github, principal: props.principal,
    });

    const pipeline = new Pipeline(this);
    pipeline.createResources({
      projectName: props.projectName, credentialArn: props.credentialArn,
      github: props.github,
      stages: { initialize: initializeStage, build: buildStage, deploy: deployStage, finalize: finalizeStage },
      deploy: { service: props.service, role: iam.pipelineRole, artifact: { bucket: props.artifact.bucket, outputs: { source: sourceArtifact, build: buildArtifact } } },
      provisioning: { build: build.projects.build, release: build.projects.release, bridge: build.projects.bridge }
    });
  }
}
