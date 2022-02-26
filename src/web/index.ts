import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import { Iam } from './resources/iam';
import { TaskDefinition } from './resources/taskdefinition';
import { Service } from './resources/service';
import { AutoScale } from './resources/autoscale';
import { Listener } from './resources/listener';
import { Props } from './props';

interface IWebResource {
  readonly service: ecs.FargateService;
}
export class WebResource extends cdk.Construct implements IWebResource {
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
      projectName: props.projectName, cpu: props.ecs.cpu, memoryLimitMiB: props.ecs.memoryLimitMiB,
      executionRole: executionRole, taskRole: taskRole, logGroup: props.ecs.logGroup, containers: props.ecs.containers,
    })

    const ecsService = new Service(this).createFargateService({
      projectName: props.projectName, cluster: props.ecs.cluster, taskDefinition: taskDefinition,
      desiredCount: props.autoScale.minCapacity, securityGroups: props.vpc.securityGroups, subnets: props.vpc.subnets,
    });

    if (props.listener?.listenerArn) {
      const listener = new Listener(this);
      const tg = listener.createTargetGroup({
        projectName: props.projectName, vpc: props.ecs.cluster.vpc, targets: [ecsService], port: props.listener.appPort, healthCheckPath: props.listener.healthCheckPath
      });
      listener.createListenerRule({
        projectName: props.projectName, listenerArn: props.listener.listenerArn, conditions: props.listener.conditions, priority: props.listener.priority, targetGroups: [tg]
      });
    }

    const autoscale = new AutoScale(this);
    const capacity = autoscale.createCapacity({ service: ecsService, minCapacity: props.autoScale.minCapacity, maxCapacity: props.autoScale.maxCapacity });
    autoscale.cpuStepScaling({ projectName: props.projectName, service: ecsService, capacity: capacity, scalingIntervals: props.autoScale.cpuUtilization?.steps || [] });
    autoscale.cpuTargetTrackingScaling({ projectName: props.projectName, service: ecsService, capacity: capacity, utilizationPercent: props.autoScale.cpuUtilization?.target || 0 });
    autoscale.memoryStepScaling({ projectName: props.projectName, service: ecsService, capacity: capacity, scalingIntervals: props.autoScale.memoryUtilization?.steps || [] });
    autoscale.memoryTargetTrackingScaling({ projectName: props.projectName, service: ecsService, capacity: capacity, utilizationPercent: props.autoScale.memoryUtilization?.target || 0 });
    autoscale.scheduledScaliung({ projectName: props.projectName, service: ecsService, capacity: capacity, schedules: props.autoScale.schedules || [] });

    this.service = ecsService;
  }
}
