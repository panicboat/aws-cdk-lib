import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import { Resource } from '../resource';
import { FargateServiceProps } from '../props';

interface IService {
  createFargateService(props: FargateServiceProps): ecs.FargateService
}
export class Service extends Resource implements IService {

  public createFargateService(props: FargateServiceProps) {
    const service = new ecs.FargateService(this.scope, `Service-${props.projectName}`, {
      cluster: props.cluster,
      taskDefinition: props.taskDefinition,
      circuitBreaker: {
        rollback: true
      },
      cloudMapOptions: {
        name: props.projectName,
        cloudMapNamespace: props.namespace,
        dnsTtl: cdk.Duration.seconds(0),
      },
      deploymentController: {
        type: ecs.DeploymentControllerType.ECS
      },
      desiredCount: props.desiredCount,
      enableECSManagedTags: true,
      enableExecuteCommand: true,
      securityGroups: props.securityGroups,
      serviceName: props.projectName,
      vpcSubnets: {
        subnets: props.subnets
      },
    });
    return service;
  }
}
