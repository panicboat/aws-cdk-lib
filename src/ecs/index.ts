import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import { Iam } from './resources/iam';
import { TaskDefinition } from './resources/taskdefinition';
import { Service } from './resources/service';
import { AutoScale } from './resources/autoscale';
import { Props } from './props';

interface IEcsResources {
  readonly service: ecs.FargateService;
}
export class EcsResources extends cdk.Construct implements IEcsResources {
  public service!: ecs.FargateService;

  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id);

    const iam = new Iam(this);
    const executionRole = iam.createTaskExecutionRole({
      projectName: props.projectName,
      managedPolicies: props.ecs.role.execution.managedPolicies,
      inlinePolicies: props.ecs.role.execution.inlinePolicies
    });
    const taskRole = iam.createTaskRole({
      projectName: props.projectName,
      managedPolicies: props.ecs.role.task.managedPolicies,
      inlinePolicies: props.ecs.role.task.inlinePolicies
    });

    const taskDefinition = new TaskDefinition(this).createTaskDefinition({
      projectName: props.projectName, cpu: props.ecs.cpu, memoryLimitMiB: props.ecs.memoryLimitMiB, appPorts: props.ecs.appPorts, virtualNodeName: props.ecs.virtualNodeName,
      executionRole: executionRole, taskRole: taskRole, logGroup: props.ecs.logGroup, containers: props.ecs.containers,
    })

    const ecsService = new Service(this).createFargateService({
      projectName: props.projectName, cluster: props.ecs.cluster, taskDefinition: taskDefinition, namespace: props.ecs.namespace,
      desiredCount: props.autoScale.minCapacity, securityGroups: props.vpc.securityGroups, subnets: props.vpc.subnets,
    });

    const autoscale = new AutoScale(this);
    const capacity = autoscale.createCapacity({ service: ecsService, minCapacity: props.autoScale.minCapacity, maxCapacity: props.autoScale.maxCapacity });
    autoscale.cpuStepScaling({ projectName: props.projectName, service: ecsService, capacity: capacity, scalingIntervals: props.autoScale.cpuUtilization?.steps || [] });
    autoscale.cpuTargetTrackingScaling({ projectName: props.projectName, service: ecsService, capacity: capacity, utilizationPercent: props.autoScale.cpuUtilization?.target || 0 });
    autoscale.memoryStepScaling({ projectName: props.projectName, service: ecsService, capacity: capacity, scalingIntervals: props.autoScale.memoryUtilization?.steps || [] });
    autoscale.memoryTargetTrackingScaling({ projectName: props.projectName, service: ecsService, capacity: capacity, utilizationPercent: props.autoScale.memoryUtilization?.target || 0 });

    this.service = ecsService;
  }
}
