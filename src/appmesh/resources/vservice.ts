import * as appmesh from '@aws-cdk/aws-appmesh';
import { VirtualServiceProps } from '../props';
import { Resource } from '../resource';

interface IVirtualService {
  createService(props: VirtualServiceProps): appmesh.IVirtualService;
}
export class VirtualService extends Resource implements IVirtualService {

  public createService(props: VirtualServiceProps) {
    const service = new appmesh.VirtualService(this.scope, `VirtualService-${props.projectName}`, {
      virtualServiceProvider: appmesh.VirtualServiceProvider.virtualRouter(props.router),
      virtualServiceName: props.serviceName,
    });
    return service;
  }
}
