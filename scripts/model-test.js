const server = require (`../../server/server`);
server (async (app) => {
    let plan = await app.models.OperationalPlan.findById(355);
    plan.getNearestRoutes(907,'Автобус')
});
