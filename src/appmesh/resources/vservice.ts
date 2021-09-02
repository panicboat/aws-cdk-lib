import * as appmesh from '@aws-cdk/aws-appmesh';
import { IService } from '@aws-cdk/aws-servicediscovery';
import { Resource } from '../resource';

interface Props {
  projectName: string;
  serviceName: string;
  router: appmesh.IVirtualRouter;
}
interface IVirtualService {
  readonly service: IService;
  createResources(props: Props): void;
}
export class VirtualService extends Resource implements IVirtualService {
  public service!: IService;
  public createResources(props: Props): void {
    new appmesh.VirtualService(this.scope, 'VirtualService', {
      virtualServiceProvider: appmesh.VirtualServiceProvider.virtualRouter(props.router),
      virtualServiceName: props.serviceName,
    });
  }
}
