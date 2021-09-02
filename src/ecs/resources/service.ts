import * as ecs from '@aws-cdk/aws-ecs';
import { INamespace } from '@aws-cdk/aws-servicediscovery';
import { Resource } from '../resource';

interface Props {
  projectName: string;
  cluster: ecs.ICluster;
  taskDefinition: ecs.TaskDefinition;
  namespace: INamespace,
  desiredCount: number,
}
interface IService {
  createResources(props: Props): void;
}
export class Service extends Resource implements IService {
  public createResources(props: Props): void {
    const service = new ecs.FargateService(this.scope, `Service-${props.projectName}`, {
      cluster: props.cluster,
      taskDefinition: props.taskDefinition,
      cloudMapOptions: {
        name: props.projectName,
        cloudMapNamespace: props.namespace,
      },
      desiredCount: props.desiredCount
    });
  }
}
