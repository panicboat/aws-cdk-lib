import * as ecs from '@aws-cdk/aws-ecs';
import { ISecurityGroup, ISubnet } from '@aws-cdk/aws-ec2';
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
