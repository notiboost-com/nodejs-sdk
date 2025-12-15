const https = require('https');
const http = require('http');
const { URL } = require('url');

class NotiBoostError extends Error {
  constructor(message, statusCode, response) {
    super(message);
    this.name = 'NotiBoostError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

class NotiBoostClient {
  constructor(options = {}) {
    if (!options.apiKey) {
      throw new Error('API key is required');
    }

    this.apiKey = options.apiKey;
    this.baseURL = options.baseURL || 'https://api.notiboost.com';
    this.timeout = options.timeout || 30000;
    this.retries = options.retries || 3;

    // Initialize resource clients
    this.events = new EventsClient(this);
    this.users = new UsersClient(this);
    this.flows = new FlowsClient(this);
    this.templates = new TemplatesClient(this);
    this.webhooks = new WebhooksClient(this);
  }

  async request(method, path, data = null, options = {}) {
    const url = new URL(`${this.baseURL}${path}`);
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    let body = null;
    if (data && (method === 'POST' || method === 'PUT')) {
      body = JSON.stringify(data);
      headers['Content-Length'] = Buffer.byteLength(body);
    }

    const requestOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: headers,
      timeout: this.timeout
    };

    let lastError;
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const response = await this._makeRequest(requestOptions, body);
        
        if (response.statusCode >= 200 && response.statusCode < 300) {
          return response.data;
        } else if (response.statusCode === 429 && attempt < this.retries) {
          // Rate limit - wait and retry
          const retryAfter = parseInt(response.headers['retry-after'] || '1', 10);
          await this._sleep(retryAfter * 1000);
          continue;
        } else {
          throw new NotiBoostError(
            response.data?.message || `HTTP ${response.statusCode}`,
            response.statusCode,
            response.data
          );
        }
      } catch (error) {
        lastError = error;
        if (attempt < this.retries && !(error instanceof NotiBoostError)) {
          await this._sleep(Math.pow(2, attempt) * 1000); // Exponential backoff
          continue;
        }
        throw error;
      }
    }

    throw lastError;
  }

  _makeRequest(options, body) {
    return new Promise((resolve, reject) => {
      const protocol = options.port === 443 || options.port === undefined ? https : http;
      const req = protocol.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          let parsedData;
          try {
            parsedData = data ? JSON.parse(data) : {};
          } catch (e) {
            parsedData = { message: data };
          }

          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (body) {
        req.write(body);
      }

      req.end();
    });
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class EventsClient {
  constructor(client) {
    this.client = client;
  }

  async ingest(event) {
    if (!event.occurred_at) {
      event.occurred_at = new Date().toISOString();
    }
    return this.client.request('POST', '/api/v1/events', event);
  }

  async ingestBatch(events) {
    return this.client.request('POST', '/api/v1/events/batch', { events });
  }
}

class UsersClient {
  constructor(client) {
    this.client = client;
  }

  async create(user) {
    return this.client.request('POST', '/api/v1/users', user);
  }

  async get(userId) {
    return this.client.request('GET', `/api/v1/users/${userId}`);
  }

  async update(userId, data) {
    return this.client.request('PUT', `/api/v1/users/${userId}`, data);
  }

  async delete(userId) {
    return this.client.request('DELETE', `/api/v1/users/${userId}`);
  }

  async setChannelData(userId, channelData) {
    return this.client.request('PUT', `/api/v1/users/${userId}/channel_data`, channelData);
  }

  async setPreferences(userId, preferences) {
    return this.client.request('PUT', `/api/v1/users/${userId}/preferences`, preferences);
  }

  async createBatch(users) {
    return this.client.request('POST', '/api/v1/users/batch', { users });
  }
}

class FlowsClient {
  constructor(client) {
    this.client = client;
  }

  async create(flow) {
    return this.client.request('POST', '/api/v1/flows', flow);
  }
}

class TemplatesClient {
  constructor(client) {
    this.client = client;
  }

  async create(template) {
    return this.client.request('POST', '/api/v1/templates', template);
  }

  async list(options = {}) {
    const query = new URLSearchParams(options).toString();
    const path = query ? `/api/v1/templates?${query}` : '/api/v1/templates';
    return this.client.request('GET', path);
  }

  async get(templateId) {
    return this.client.request('GET', `/api/v1/templates/${templateId}`);
  }

  async update(templateId, data) {
    return this.client.request('PUT', `/api/v1/templates/${templateId}`, data);
  }
}

class WebhooksClient {
  constructor(client) {
    this.client = client;
  }

  async create(webhook) {
    return this.client.request('POST', '/api/v1/webhooks', webhook);
  }
}

module.exports = {
  NotiBoost: NotiBoostClient,
  NotiBoostError
};

