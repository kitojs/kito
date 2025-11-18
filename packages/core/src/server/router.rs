use ahash::AHashMap;
use matchit::{Match, Router as MatchitRouter};
use parking_lot::RwLock;
use std::sync::Arc;

use super::routes::CompiledRoute;

pub struct TrieRouter {
    inner: MatchitRouter<Arc<CompiledRoute>>,
}

impl Default for TrieRouter {
    fn default() -> Self {
        Self::new()
    }
}

impl TrieRouter {
    pub fn new() -> Self {
        Self { inner: MatchitRouter::new() }
    }

    pub fn insert(&mut self, path: &str, route: Arc<CompiledRoute>) -> Result<(), String> {
        self.inner.insert(path, route).map_err(|e| format!("Failed to insert route: {e}"))
    }

    pub fn find<'a>(&'a self, path: &'a str) -> Option<Match<'a, 'a, &'a Arc<CompiledRoute>>> {
        self.inner.at(path).ok()
    }
}

pub struct HttpRouter {
    static_routes: AHashMap<Box<str>, Arc<CompiledRoute>>,
    dynamic_routes: TrieRouter,
}

impl Default for HttpRouter {
    fn default() -> Self {
        Self::new()
    }
}

impl HttpRouter {
    pub fn new() -> Self {
        Self { static_routes: AHashMap::new(), dynamic_routes: TrieRouter::new() }
    }

    pub fn insert(&mut self, route: CompiledRoute) -> Result<(), String> {
        let route_arc = Arc::new(route);

        if Self::is_static_route(&route_arc.path) {
            self.static_routes.insert(route_arc.path.clone(), route_arc.clone());
        } else {
            self.dynamic_routes.insert(&route_arc.path, route_arc.clone())?;
        }

        Ok(())
    }

    pub fn find<'a>(&'a self, path: &'a str) -> Option<RouteMatch> {
        if let Some(route) = self.static_routes.get(path) {
            return Some(RouteMatch { route: route.clone(), params: AHashMap::new() });
        }

        if let Some(matched) = self.dynamic_routes.find(path) {
            let mut params = AHashMap::new();

            for (key, value) in matched.params.iter() {
                params.insert(key.to_string(), value.to_string());
            }

            return Some(RouteMatch { route: matched.value.clone(), params });
        }

        None
    }

    fn is_static_route(path: &str) -> bool {
        !path.contains(':') && !path.contains('*') && !path.contains('{')
    }
}

pub struct RouteMatch {
    pub route: Arc<CompiledRoute>,
    pub params: AHashMap<String, String>,
}

pub struct GlobalRouter {
    routers: RwLock<AHashMap<Box<str>, HttpRouter>>,
}

impl Default for GlobalRouter {
    fn default() -> Self {
        Self::new()
    }
}

impl GlobalRouter {
    pub fn new() -> Self {
        Self { routers: RwLock::new(AHashMap::new()) }
    }

    pub fn insert(&self, method: &str, route: CompiledRoute) -> Result<(), String> {
        let mut routers = self.routers.write();
        let router = routers.entry(method.to_string().into_boxed_str()).or_default();

        router.insert(route)
    }

    pub fn find(&self, method: &str, path: &str) -> Option<RouteMatch> {
        let routers = self.routers.read();

        if let Some(router) = routers.get(method) {
            return router.find(path);
        }

        None
    }

    pub fn route_count(&self) -> usize {
        let routers = self.routers.read();
        routers.values().map(|r| r.static_routes.len()).sum()
    }
}
