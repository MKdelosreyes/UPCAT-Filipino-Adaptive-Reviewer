"use client";

import { useEffect, useState } from "react";
import { checkAIServiceHealth } from "@/lib/api/ai-service";

interface ServiceStatus {
  name: string;
  status: "online" | "offline" | "degraded";
  latency?: number;
  lastChecked: Date;
}

export default function HealthDashboard() {
  const [services, setServices] = useState<ServiceStatus[]>([]);

  useEffect(() => {
    async function checkServices() {
      const startTime = Date.now();
      const aiHealthy = await checkAIServiceHealth();
      const aiLatency = Date.now() - startTime;

      // Check backend
      const backendStart = Date.now();
      const backendHealthy = await fetch("/api/health")
        .then((r) => r.ok)
        .catch(() => false);
      const backendLatency = Date.now() - backendStart;

      setServices([
        {
          name: "AI Service",
          status: aiHealthy ? "online" : "offline",
          latency: aiLatency,
          lastChecked: new Date(),
        },
        {
          name: "Backend API",
          status: backendHealthy ? "online" : "offline",
          latency: backendLatency,
          lastChecked: new Date(),
        },
      ]);
    }

    checkServices();
    const interval = setInterval(checkServices, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">System Health</h1>
      <div className="grid gap-4">
        {services.map((service) => (
          <div
            key={service.name}
            className={`p-4 rounded-lg border-2 ${
              service.status === "online"
                ? "bg-green-50 border-green-500"
                : "bg-red-50 border-red-500"
            }`}
          >
            <h3 className="font-semibold">{service.name}</h3>
            <p>Status: {service.status}</p>
            {service.latency && <p>Latency: {service.latency}ms</p>}
            <p className="text-sm text-gray-600">
              Last checked: {service.lastChecked.toLocaleTimeString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
