import * as appmesh from '@aws-cdk/aws-appmesh';
import { Resource } from '../resource';

interface Props {
  projectName: string;
  mesh: appmesh.IMesh;
  vRouterListeners: appmesh.VirtualRouterListener[];
  weightedTargets: appmesh.WeightedTarget[];
  grpcRoute: { name: string, match: appmesh.GrpcRouteMatch }[];
  httpRoute: { name: string, match: appmesh.HttpRouteMatch }[];
  http2Route: { name: string, match: appmesh.HttpRouteMatch }[];
  tcpRoute: { name: string }[];
}
interface IVirtualRouter {
  readonly router: appmesh.IVirtualRouter;
  createResources(props: Props): void;
}
export class VirtualRouter extends Resource implements IVirtualRouter {
  public router!: appmesh.IVirtualRouter;
  public createResources(props: Props): void {
    const router = props.mesh.addVirtualRouter('VirtualRouter', {
      listeners: props.vRouterListeners,
      virtualRouterName: props.projectName
    });

    props.grpcRoute.forEach(grpcRoute => {
      router.addRoute(`GrpcRoute-${grpcRoute.name}`, {
        routeName: grpcRoute.name,
        routeSpec: appmesh.RouteSpec.grpc({
          weightedTargets: props.weightedTargets,
          match: grpcRoute.match
        })
      });
    });

    props.httpRoute.forEach(httpRoute => {
      router.addRoute(`HttpRoute-${httpRoute.name}`, {
        routeName: httpRoute.name,
        routeSpec: appmesh.RouteSpec.http({
          weightedTargets: props.weightedTargets,
          match: httpRoute.match
        })
      });
    });

    props.http2Route.forEach(http2Route => {
      router.addRoute(`Http2Route-${http2Route.name}`, {
        routeName: http2Route.name,
        routeSpec: appmesh.RouteSpec.http2({
          weightedTargets: props.weightedTargets,
          match: http2Route.match
        })
      });
    });

    props.tcpRoute.forEach(tcpRoute => {
      router.addRoute(`TcpRoute-${tcpRoute.name}`, {
        routeName: tcpRoute.name,
        routeSpec: appmesh.RouteSpec.tcp({
          weightedTargets: props.weightedTargets,
        })
      });
    });

    this.router = router;
  }
}
