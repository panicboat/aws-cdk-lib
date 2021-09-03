import * as cdk from '@aws-cdk/core';
import * as appmesh from '@aws-cdk/aws-appmesh';
import { VirtualRouter } from './resources/vrouter';
import { VirtualService } from './resources/vservice';
import { VirtualNode } from './resources/vnode';

interface Props {
  projectName: string;
  serviceName: string;
  mesh: appmesh.IMesh;
  vRouterListeners: appmesh.VirtualRouterListener[];
  nodes: { name: string, hostname: string, vNodeListeners: appmesh.VirtualNodeListener[], weight: number }[];
}
interface IMeshResources {
  readonly vRouter: appmesh.IVirtualRouter;
  readonly weightedTargets: appmesh.WeightedTarget[];
}
export class MeshResources extends cdk.Construct implements IMeshResources {
  public vRouter!: appmesh.IVirtualRouter;
  public weightedTargets!: appmesh.WeightedTarget[];
  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id);

    const node = new VirtualNode(this);
    node.createResources({ projectName: props.projectName, mesh: props.mesh, nodes: props.nodes });

    const router = new VirtualRouter(this);
    router.createResources({ projectName: props.projectName, mesh: props.mesh, vRouterListeners: props.vRouterListeners });

    const service = new VirtualService(this);
    service.createResources({ projectName: props.projectName, serviceName: props.serviceName, router: router.router });

    this.vRouter = router.router;
    this.weightedTargets = node.weightedTargets;
  }
}
