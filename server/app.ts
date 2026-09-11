import express, { Express, Request, Response } from 'express';
import { stateManager } from './state';
import { tools } from './tools';
import { processUserMessage } from './gemini';
import { caspianService } from './caspian';

export function createExpressApp(): Express {
  const app = express();

  app.use(express.json());

  // Health Check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // State Management
  app.get('/api/state', (_req: Request, res: Response) => {
    res.json(stateManager.getState());
  });

  app.post('/api/state/sync', (req: Request, res: Response) => {
    const synced = stateManager.syncFromClient(req.body || {});
    res.json({ message: 'State synchronized with client storage', state: synced });
  });

  app.post('/api/reset', (_req: Request, res: Response) => {
    const fresh = stateManager.resetState();
    res.json({ message: 'State reset to initial seed values', state: fresh });
  });

  // Task Endpoints
  app.post('/api/tasks', (req: Request, res: Response) => {
    const { title, category, priority, dueDate, amount, provider } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' });
    }
    const task = stateManager.addTask(title.trim(), category, priority, dueDate, amount, provider);
    res.status(201).json(task);
  });

  app.patch('/api/tasks/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { completed, ...updates } = req.body;
    if (completed !== undefined) {
      const task = stateManager.completeTask(id, completed);
      if (!task) return res.status(404).json({ error: 'Task not found' });
      return res.json(task);
    }
    const task = stateManager.updateTask(id, updates);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  });

  app.delete('/api/tasks/:id', (req: Request, res: Response) => {
    const ok = stateManager.deleteTask(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true });
  });

  // Inventory Endpoints
  app.post('/api/inventory', (req: Request, res: Response) => {
    const {
      name,
      quantity,
      unit,
      status,
      category,
      location,
      subLocation,
      estimatedRemaining,
      lastRestocked,
      avgUsage,
      icon,
      id,
      badge,
      date,
    } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Item name is required' });
    }
    const item = stateManager.addInventoryItem(
      name.trim(),
      quantity,
      unit,
      status,
      category,
      'user',
      location,
      subLocation,
      estimatedRemaining,
      lastRestocked,
      avgUsage,
      icon,
      id,
      badge,
      date
    );
    res.status(201).json(item);
  });

  app.patch('/api/inventory/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { quantity, status } = req.body;
    const item = stateManager.updateInventory(id, quantity, status);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  });

  app.delete('/api/inventory/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const deleted = stateManager.deleteInventoryItem(id);
    if (!deleted) return res.status(404).json({ error: 'Inventory item not found' });
    res.json({ success: true, message: `Inventory item ${id} deleted` });
  });

  // Shopping Endpoints
  app.post('/api/shopping', (req: Request, res: Response) => {
    const { name, quantity, category } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Shopping item name is required' });
    }
    const item = stateManager.addShoppingItem(name.trim(), quantity, category);
    res.status(201).json(item);
  });

  app.patch('/api/shopping/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { completed } = req.body;
    const item = stateManager.completeShoppingItem(id, completed ?? true);
    if (!item) return res.status(404).json({ error: 'Shopping item not found' });
    res.json(item);
  });

  app.delete('/api/shopping/:id', (req: Request, res: Response) => {
    const ok = stateManager.removeShoppingItem(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Shopping item not found' });
    res.json({ success: true });
  });

  // Bills Endpoints
  app.post('/api/bills', (req: Request, res: Response) => {
    const { name, amount, dueDate } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Bill name is required' });
    }
    const parsedAmount = Number(amount);
    if (amount !== undefined && isNaN(parsedAmount)) {
      return res.status(400).json({ error: 'Amount must be a valid number' });
    }
    const bill = stateManager.addBill(name.trim(), parsedAmount || 0, dueDate || 'Upcoming');
    res.status(201).json(bill);
  });

  app.patch('/api/bills/:id/pay', (req: Request, res: Response) => {
    const { id } = req.params;
    const { paid } = req.body;
    const bill = stateManager.markBillPaid(id, paid !== false);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    res.json(bill);
  });

  // Maintenance Endpoints
  app.post('/api/maintenance', (req: Request, res: Response) => {
    const { title, category, dueDate, provider } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Maintenance title is required' });
    }
    const item = stateManager.addMaintenanceTask(title.trim(), category, dueDate, provider);
    res.status(201).json(item);
  });

  app.patch('/api/maintenance/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const item = stateManager.completeMaintenanceTask(id, status);
    if (!item) return res.status(404).json({ error: 'Maintenance record not found' });
    res.json(item);
  });

  // AI Agent Endpoints
  app.post('/api/agent/chat', async (req: Request, res: Response) => {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    try {
      const result = await processUserMessage(message, history || []);
      const currentState = stateManager.getState();
      res.json({
        ...result,
        updatedState: currentState,
      });
    } catch (err: any) {
      console.error('[Agent API Error]', err);
      res.status(500).json({ error: err.message || 'Agent processing failed' });
    }
  });

  app.get('/api/agent/briefing', (_req: Request, res: Response) => {
    const briefing = tools.getHomeBriefing();
    res.json(briefing);
  });

  app.get('/api/agent/prioritize', (_req: Request, res: Response) => {
    const priorities = tools.prioritizeHouseholdTasks();
    res.json(priorities);
  });

  app.get('/api/agent/what-now', (_req: Request, res: Response) => {
    const whatNow = tools.whatShouldIDoNow();
    res.json(whatNow);
  });

  app.get('/api/agent/weekly-plan', (_req: Request, res: Response) => {
    const plan = tools.generateWeeklyPlan();
    res.json(plan);
  });

  // Caspian Webhook & Simulator Endpoints
  app.get('/api/caspian/status', (_req: Request, res: Response) => {
    res.json(caspianService.getStatus());
  });

  app.get('/api/caspian/channels', async (_req: Request, res: Response) => {
    const channels = await caspianService.fetchLiveChannels();
    res.json({ channels });
  });

  // Webhook endpoint for live Caspian hosted bot updates
  app.post('/api/caspian/webhook', async (req: Request, res: Response) => {
    try {
      const parsed = caspianService.parseWebhookPayload(req.body);
      if (!parsed || !parsed.text) {
        return res.status(200).json({ ok: true, note: 'Ignored non-text payload' });
      }

      const result = await caspianService.handleIncomingMessage(
        parsed.channel,
        parsed.senderId,
        parsed.text
      );

      res.status(200).json({
        ok: true,
        response: result.response,
        tools: result.agentToolsExecuted,
      });
    } catch (err: any) {
      console.error('[Caspian Webhook Error]', err);
      res.status(500).json({ error: err.message || 'Webhook processing failed' });
    }
  });

  app.post('/api/caspian/simulate', async (req: Request, res: Response) => {
    const { text, channel, senderId } = req.body;
    if (!text) return res.status(400).json({ error: 'Text message is required' });

    const result = await caspianService.handleIncomingMessage(
      channel || 'Telegram',
      senderId || 'telegram_user_101',
      text
    );
    res.json({
      ...result,
      updatedState: stateManager.getState(),
    });
  });

  // Analytics Endpoints
  app.get('/api/analytics', (_req: Request, res: Response) => {
    res.json(stateManager.getState().analytics);
  });

  // Activity Calendar & Change History Endpoints
  app.get('/api/activities', (req: Request, res: Response) => {
    const { date, startDate, endDate, type, limit } = req.query;

    if (date && typeof date === 'string') {
      return res.json(stateManager.getActivitiesByDate(date));
    }

    if (startDate && endDate && typeof startDate === 'string' && typeof endDate === 'string') {
      return res.json(stateManager.getActivitiesByDateRange(startDate, endDate));
    }

    if (type && typeof type === 'string') {
      const parsedLimit = limit ? parseInt(limit as string, 10) : 50;
      return res.json(stateManager.getActivitiesByCategory(type, parsedLimit));
    }

    const state = stateManager.getState();
    res.json(state.activityEvents || []);
  });

  app.post('/api/activities', (req: Request, res: Response) => {
    const { activity } = req.body;
    if (!activity || !activity.title) {
      return res.status(400).json({ error: 'Valid activity object required' });
    }
    const recorded = stateManager.recordActivityEvent(activity);
    res.status(201).json(recorded);
  });

  app.get('/api/calendar/events', (_req: Request, res: Response) => {
    const state = stateManager.getState();
    const upcoming = stateManager.getUpcomingEvents();
    res.json({
      activities: state.activityEvents || [],
      upcoming,
    });
  });

  app.get('/api/calendar/summary', (req: Request, res: Response) => {
    const period = (req.query.period as any) || 'today';
    const summary = stateManager.getActivitySummary(period);
    res.json(summary);
  });

  return app;
}
