import * as cdk from '@aws-cdk/core';
import { ISecurityGroup, IVpc } from '@aws-cdk/aws-ec2';
import { IManagedPolicy, Policy } from '@aws-cdk/aws-iam';
import { IBucket } from '@aws-cdk/aws-s3';
import { Build } from './resources/build';
import { Iam } from './resources/iam';
import { Pipeline } from './resources/pipeline';
import { PipelineProject } from '@aws-cdk/aws-codebuild';
import { IBaseService } from '@aws-cdk/aws-ecs';

interface Props {
  projectName: string
  vpc: IVpc
  securityGroups?: ISecurityGroup[]
  artifactBucket: IBucket
  credentialArn: string
  service: IBaseService
  build: {
    buildDir?: string
    cacheBucket: IBucket
    containerName: string
  }
  github: {
    owner: string
    repository: string
    branch?: string
  }
  release: {
    version: string
    account?: string
    repository?: string
  }
  stages?: {
    initialize?: {
      stageName: string
      projects: PipelineProject[]
    }[]
    build?: {
      stageName: string
      projects: PipelineProject[]
    }[]
    deploy?: {
      stageName: string
      projects: PipelineProject[]
    }[]
    finalize?: {
      stageName: string
      projects: PipelineProject[]
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

    const iam = new Iam(this);
    iam.createResources({ projectName: props.projectName, pipelineRole: pipelineRole, buildRole: buildRole });

    const build = new Build(this);
    build.createResources({
      projectName: props.projectName, vpc: props.vpc, securityGroups: securityGroups, credentialArn: props.credentialArn,
      build: { buildDir: buildDir, containerName: props.build.containerName, buildRole: iam.buildRole, cacheBucket: props.build.cacheBucket },
      github: { owner: props.github.owner, repository: props.github.repository },
      release: props.release,
    });

    const pipeline = new Pipeline(this);
    pipeline.createResources({
      projectName: props.projectName, artifactBucket: props.artifactBucket, credentialArn: props.credentialArn,
      github: { owner: props.github.owner, repository: props.github.repository, branch: props.github.branch, version: props.release.version },
      stages: { initialize: initializeStage, build: buildStage, deploy: deployStage, finalize: finalizeStage },
      deploy: { service: props.service, role: iam.pipelineRole },
      provisioning: { build: build.projects.build, release: build.projects.release, bridge: build.projects.bridge }
    });
  }
}
