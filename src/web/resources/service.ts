import * as ecs from '@aws-cdk/aws-ecs';
import { ISecurityGroup, ISubnet } from '@aws-cdk/aws-ec2';
import { Resource } from '../resource';

interface Props {
  projectName: string;
  cluster: ecs.ICluster;
  taskDefinition: ecs.TaskDefinition;
  desiredCount: number;
  securityGroups: ISecurityGroup[];
  subnets: ISubnet[];
}
interface IService {
  readonly service: ecs.FargateService;
  createResources(props: Props): void;
}
export class Service extends Resource implements IService {
  public service!: ecs.FargateService;
  public createResources(props: Props): void {
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
    this.service = service;
  }
}
