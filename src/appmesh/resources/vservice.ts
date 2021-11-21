import * as appmesh from '@aws-cdk/aws-appmesh';
import { Resource } from '../resource';

interface IVirtualService {
  createService(props: { projectName: string, serviceName: string, router: appmesh.IVirtualRouter }): appmesh.IVirtualService;
}
export class VirtualService extends Resource implements IVirtualService {

  public createService(props: { projectName: string, serviceName: string, router: appmesh.IVirtualRouter }) {
    const service = new appmesh.VirtualService(this.scope, `VirtualService-${props.projectName}`, {
      virtualServiceProvider: appmesh.VirtualServiceProvider.virtualRouter(props.router),
      virtualServiceName: props.serviceName,
    });
    return service;
  }
}
