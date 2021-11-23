import { ScalingInterval } from "@aws-cdk/aws-autoscaling"
import { ISubnet, ISecurityGroup } from "@aws-cdk/aws-ec2"
import { ContainerDefinitionOptions, FargateService, ICluster, ScalableTaskCount, TaskDefinition } from "@aws-cdk/aws-ecs"
import { IManagedPolicy, IRole, Policy } from "@aws-cdk/aws-iam"
import { ILogGroup, LogGroup } from "@aws-cdk/aws-logs"
import { INamespace } from "@aws-cdk/aws-servicediscovery"

export interface Props {
  projectName: string
  vpc: {
    subnets: ISubnet[]
    securityGroups: ISecurityGroup[]
  }
  ecs: {
    cpu: number
    memoryLimitMiB: number
    appPorts: number[]
    containers: ContainerDefinitionOptions[]
    virtualNodeName: string
    logGroup: LogGroup
    cluster: ICluster
    namespace: INamespace
    role: {
      execution: {
        managedPolicies: IManagedPolicy[]
        inlinePolicies: Policy[]
      }
      task: {
        managedPolicies: IManagedPolicy[]
        inlinePolicies: Policy[]
      }
    }
  }
  autoScale: {
    minCapacity: number
    maxCapacity: number
    cpuUtilization?: {
      steps?: ScalingInterval[]
      target?: number
    }
  }
}

export interface TaskExecutionRoleProps {
  projectName: string
  managedPolicies: IManagedPolicy[]
  inlinePolicies: Policy[]
}

export interface TaskRoleProps {
  projectName: string
  managedPolicies: IManagedPolicy[]
  inlinePolicies: Policy[]
}

export interface TaskDefinitionProps {
  projectName: string
  cpu: number
  memoryLimitMiB: number
  appPorts: number[]
  virtualNodeName: string
  taskRole: IRole
  executionRole: IRole
  logGroup: ILogGroup
  containers: ContainerDefinitionOptions[]
}

export interface FargateServiceProps {
  projectName: string
  cluster: ICluster
  taskDefinition: TaskDefinition
  namespace: INamespace
  desiredCount: number
  securityGroups: ISecurityGroup[]
  subnets: ISubnet[]
}

export interface ScaleCapacityProps {
  service: FargateService
  minCapacity: number
  maxCapacity: number
}

export interface CpuStepScalingProps {
  projectName: string
  service: FargateService
  capacity: ScalableTaskCount
  scalingIntervals: ScalingInterval[]
}

export interface CpuTargetTrackingScalingProps {
  projectName: string
  service: FargateService
  capacity: ScalableTaskCount
  cpuUtilizationPercent: number
}
