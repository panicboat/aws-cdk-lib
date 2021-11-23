import * as appmesh from '@aws-cdk/aws-appmesh';
import { GrpcRouteProps, HttpRouteProps, Http2RouteProps, VirtualRouterProps, TcpRouteProps } from '../props';
import { Resource } from '../resource';

interface IVirtualRouter {
  createRouter(props: VirtualRouterProps): appmesh.IVirtualRouter;
  addGrpcRoute(props: GrpcRouteProps): void;
  addHttpRoute(props: HttpRouteProps): void;
  addHttp2Route(props: Http2RouteProps): void;
  addTcpRoute(props: TcpRouteProps): void;
}
export class VirtualRouter extends Resource implements IVirtualRouter {

  public createRouter(props: VirtualRouterProps) {
    const router = props.mesh.addVirtualRouter(`VirtualRouter-${props.projectName}`, {
      listeners: props.listeners,
      virtualRouterName: props.projectName
    });
    return router;
  }

  public addGrpcRoute(props: GrpcRouteProps) {
    props.routes.forEach(route => {
      props.router.addRoute(`GrpcRoute-${route.name}`, {
        routeName: route.name,
        routeSpec: appmesh.RouteSpec.grpc({
          weightedTargets: props.targets,
          match: route.match
        })
      });
    });
  }

  public addHttpRoute(props: HttpRouteProps) {
    props.routes.forEach(route => {
      props.router.addRoute(`HttpRoute-${route.name}`, {
        routeName: route.name,
        routeSpec: appmesh.RouteSpec.http({
          weightedTargets: props.targets,
          match: route.match
        })
      });
    });
  }

  public addHttp2Route(props: Http2RouteProps) {
    props.routes.forEach(route => {
      props.router.addRoute(`Http2Route-${route.name}`, {
        routeName: route.name,
        routeSpec: appmesh.RouteSpec.http2({
          weightedTargets: props.targets,
          match: route.match
        })
      });
    });
  }

  public addTcpRoute(props: TcpRouteProps) {
    props.routes.forEach(route => {
      props.router.addRoute(`TcpRoute-${route.name}`, {
        routeName: route.name,
        routeSpec: appmesh.RouteSpec.tcp({
          weightedTargets: props.targets,
        })
      });
    });
  }
}
