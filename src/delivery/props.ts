import { PipelineProject } from "@aws-cdk/aws-codebuild"
import { Artifact, IAction, Pipeline } from "@aws-cdk/aws-codepipeline"
import { IVpc, ISecurityGroup } from "@aws-cdk/aws-ec2"
import { IBaseService } from "@aws-cdk/aws-ecs"
import { IManagedPolicy, IRole, Policy } from "@aws-cdk/aws-iam"
import { IBucket } from "@aws-cdk/aws-s3"

export interface Props {
  projectName: string
  vpc: IVpc
  securityGroups?: ISecurityGroup[]
  credentialArn: string
  service: IBaseService
  build: {
    buildDir?: string
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
    codestarArn?: string
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

export interface PipelineRoleProps {
  projectName: string
  managedPolicies: IManagedPolicy[]
  inlinePolicies: Policy[]
}

export interface BuildRoleProps {
  projectName: string
  managedPolicies: IManagedPolicy[]
  inlinePolicies: Policy[]
}

export interface BuildProjectProps {
  projectName: string
  vpc: IVpc
  securityGroups: ISecurityGroup[]
  build: {
    buildDir: string
    buildRole: IRole
    containerName: string
  }
  credentialArn: string
}

export interface ReleaseProjectProps {
  projectName: string
  vpc: IVpc
  securityGroups: ISecurityGroup[]
  build: {
    buildRole: IRole
  }
  github: {
    owner: string
    repository: string
    version: string
  }
  principal: {
    account: string
    repository: string
  }
  credentialArn: string
}

export interface BridgeProject {
  projectName: string
  vpc: IVpc
  securityGroups: ISecurityGroup[]
  build: {
    buildRole: IRole
    containerName: string
  }
  github: {
    owner: string
    repository: string
    version: string
  }
  credentialArn: string
}

export interface CodePipelineProps {
  projectName: string
  artifact: {
    bucket: IBucket
  }
  role: IRole
}

export interface CodeStarConnectionSourceActionProps {
  github: {
    codestarArn: string
    owner: string
    repository: string
    branch: string
  }
  artifact: {
    output: Artifact
  }
}

export interface GitHubSourceActionProps {
  projectName: string
  github: {
    owner: string
    repository: string
    branch: string
  }
  artifact: {
    output: Artifact
  }
  credentialArn: string
}

export interface EcrSourceActionProps {
  projectName: string
  github: {
    version: string
  }
  artifact: {
    output: Artifact
  }
}

export interface PipelineDeployStageStageProps {
  pipeline: Pipeline
  service: IBaseService
  role: IRole
  artifact: {
    input: Artifact
  }
}

export interface PipelineApprovalStageStageProps {
  pipeline: Pipeline
}

export interface PipelineStageProps {
  pipeline: Pipeline
  stages: {
    stageName: string
    actions: IAction[]
  }[]
}

export interface PipelineTriggerProps {
  projectName: string
  pipeline: Pipeline
  github: {
    version: string
  }
}

export interface PipelineActionProps {
  projects: PipelineProject[]
  artifact: {
    input: Artifact
    outputs: Artifact[]
  }
}
