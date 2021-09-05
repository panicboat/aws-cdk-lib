import * as appmesh from '@aws-cdk/aws-appmesh';
import { Resource } from '../resource';

interface Props {
  projectName: string;
  serviceName: string;
  router: appmesh.IVirtualRouter;
}
interface IVirtualService {
  readonly service: appmesh.IVirtualService;
  createResources(props: Props): void;
}
export class VirtualService extends Resource implements IVirtualService {
  public service!: appmesh.IVirtualService;
  public createResources(props: Props): void {
    const service = new appmesh.VirtualService(this.scope, `VirtualService-${props.projectName}`, {
      virtualServiceProvider: appmesh.VirtualServiceProvider.virtualRouter(props.router),
      virtualServiceName: props.serviceName,
    });
    this.service = service;
  }
}
