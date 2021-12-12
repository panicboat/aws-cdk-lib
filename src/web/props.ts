import { ScalingSchedule } from "@aws-cdk/aws-applicationautoscaling"
import { ScalingInterval } from "@aws-cdk/aws-autoscaling"
import { ISubnet, ISecurityGroup, IVpc } from "@aws-cdk/aws-ec2"
import { ContainerDefinitionOptions, FargateService, ICluster, ScalableTaskCount, TaskDefinition } from "@aws-cdk/aws-ecs"
import { IApplicationLoadBalancerTarget, IApplicationTargetGroup } from "@aws-cdk/aws-elasticloadbalancingv2"
import { IManagedPolicy, IRole, Policy } from "@aws-cdk/aws-iam"
import { ILogGroup, LogGroup } from "@aws-cdk/aws-logs"

export interface Props {
  projectName: string
  vpc: {
    subnets: ISubnet[]
    securityGroups: ISecurityGroup[]
  }
  ecs: {
    cpu: number
    memoryLimitMiB: number
    containers: ContainerDefinitionOptions[]
    logGroup: LogGroup
    cluster: ICluster
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
    memoryUtilization?: {
      steps?: ScalingInterval[]
      target?: number
    }
    schedules?: ScalingSchedule[]
  }
  listener?: {
    listenerArn: string
    healthCheckPath: string
    appPort: number
    priority: number
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
  taskRole: IRole
  executionRole: IRole
  logGroup: ILogGroup
  containers: ContainerDefinitionOptions[]
}

export interface FargateServiceProps {
  projectName: string
  cluster: ICluster
  taskDefinition: TaskDefinition
  desiredCount: number
  securityGroups: ISecurityGroup[]
  subnets: ISubnet[]
}

export interface ScaleCapacityProps {
  service: FargateService
  minCapacity: number
  maxCapacity: number
}

export interface ScaleCapacityProps {
  service: FargateService
  minCapacity: number
  maxCapacity: number
}

export interface StepScalingProps {
  projectName: string
  service: FargateService
  capacity: ScalableTaskCount
  scalingIntervals: ScalingInterval[]
}

export interface TargetTrackingScalingProps {
  projectName: string
  service: FargateService
  capacity: ScalableTaskCount
  utilizationPercent: number
}

export interface ScheduledScalingProps {
  projectName: string
  service: FargateService
  capacity: ScalableTaskCount
  schedules: ScalingSchedule[]
}

export interface TargetGroupProps {
  projectName: string
  vpc: IVpc
  targets: IApplicationLoadBalancerTarget[]
  port: number
  healthCheckPath: string
}

export interface ListenerProps {
  projectName: string
  listenerArn: string
  priority: number
  targetGroups: IApplicationTargetGroup[]
}
