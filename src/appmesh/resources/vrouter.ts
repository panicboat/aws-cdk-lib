import * as cdk from '@aws-cdk/core';
import * as appmesh from '@aws-cdk/aws-appmesh';
import { Resource } from '../resource';

interface Props {
  projectName: string;
  mesh: appmesh.IMesh;
  vRouterListeners: appmesh.VirtualRouterListener[];
}
interface IVirtualRouter {
  readonly router: appmesh.IVirtualRouter;
  createResources(props: Props): void;
}
export class VirtualRouter extends Resource implements IVirtualRouter {
  public router!: appmesh.IVirtualRouter;
  public createResources(props: Props): void {
    const router = props.mesh.addVirtualRouter(`${props.projectName}VirtualRouter`, {
      listeners: props.vRouterListeners,
      virtualRouterName: props.projectName
    });
    this.router = router;
  }
}
