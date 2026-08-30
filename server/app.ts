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

  app.post('/api/reset', (_req: Request, res: Response) => {
    const fresh = stateManager.resetState();
    res.json({ message: 'State reset to initial seed values', state: fresh });
  });

  // Task Endpoints
  app.post('/api/tasks', (req: Request, res: Response) => {
    const { title, category, priority, dueDate, amount, provider } = req.body;
    const task = stateManager.addTask(title, category, priority, dueDate, amount, provider);
    res.json(task);
  });

  app.patch('/api/tasks/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { completed, ...updates } = req.body;
    if (completed !== undefined) {
      const task = stateManager.completeTask(id, completed);
      return res.json(task || { error: 'Task not found' });
    }
    const task = stateManager.updateTask(id, updates);
    res.json(task || { error: 'Task not found' });
  });

  app.delete('/api/tasks/:id', (req: Request, res: Response) => {
    const ok = stateManager.deleteTask(req.params.id);
    res.json({ success: ok });
  });

  // Inventory Endpoints
  app.post('/api/inventory', (req: Request, res: Response) => {
    const { name, quantity, unit, status, category } = req.body;
    const item = stateManager.addInventoryItem(name, quantity, unit, status, category);
    res.json(item);
  });

  app.patch('/api/inventory/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { quantity, status } = req.body;
    const item = stateManager.updateInventory(id, quantity, status);
    res.json(item || { error: 'Item not found' });
  });

  // Shopping Endpoints
  app.post('/api/shopping', (req: Request, res: Response) => {
    const { name, quantity, category } = req.body;
    const item = stateManager.addShoppingItem(name, quantity, category);
    res.json(item);
  });

  app.patch('/api/shopping/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { completed } = req.body;
    const item = stateManager.completeShoppingItem(id, completed ?? true);
    res.json(item || { error: 'Shopping item not found' });
  });

  app.delete('/api/shopping/:id', (req: Request, res: Response) => {
    const ok = stateManager.removeShoppingItem(req.params.id);
    res.json({ success: ok });
  });

  // Bills Endpoints
  app.post('/api/bills', (req: Request, res: Response) => {
    const { name, amount, dueDate } = req.body;
    const bill = stateManager.addBill(name, Number(amount) || 0, dueDate);
    res.json(bill);
  });

  app.patch('/api/bills/:id/pay', (req: Request, res: Response) => {
    const { id } = req.params;
    const { paid } = req.body;
    const bill = stateManager.markBillPaid(id, paid !== false);
    res.json(bill || { error: 'Bill not found' });
  });

  // Maintenance Endpoints
  app.post('/api/maintenance', (req: Request, res: Response) => {
    const { title, category, dueDate, provider } = req.body;
    const item = stateManager.addMaintenanceTask(title, category, dueDate, provider);
    res.json(item);
  });

  app.patch('/api/maintenance/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const item = stateManager.completeMaintenanceTask(id, status);
    res.json(item || { error: 'Maintenance record not found' });
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

  return app;
}
