---
name: create_stock_chart
description: Create a stock performance chart component using the reusable StockPerformanceChart engine.
---

# Create Stock Chart Skill

Use this skill when the user asks for a stock chart or performance graph, especially when they provide a reference image or data points.

## 1. Extract Data
If the user provides an image, estimate the data points (~12-15 points are usually enough for a smooth line).
If the user provides raw data, use it directly.

## 2. Create Component
Create a new component in `apps/blog/components/charts/[chart-name].tsx`.

```typescript
"use client";

import { StockPerformanceChart } from './stock-performance-chart';

const labels = ['Jan', 'Feb', 'Mar', ...];
const dataValues = [100, 105, 98, ...];

export function [ChartName]() {
    return (
        <StockPerformanceChart
            labels={labels}
            data={dataValues}
            title="[Chart Title]"
            // Optional: Add a tag next to the title
            tag={{ text: '[Tag Text]', color: 'red' | 'green' | 'blue' }}
            // Optional: Add a badge at the end of the line
            badge={{ text: '[Badge Text]', color: 'red' | 'green' }}
            // Color of the line
            color="red" | "green" | "blue"
            // Y-Axis configuration
            yAxis={{
                min: 0,
                max: 100,
                stepSize: 10,
                display: true,
                format: (v) => \`\${v}%\` // Optional custom format
            }}
            footerText="[Optional Footer Text]"
        />
    );
}
```

## 3. Register Component
Add the new component to the `components` map in `apps/blog/app/articles/[slug]/page.tsx`.

```typescript
import { [ChartName] } from '@/components/charts/[chart-name]';

// ... inside MDXRemote components map
[ChartName]: [ChartName],
```

## 4. Embed in Markdown
Usage in MDX files:
```markdown
<[ChartName] />
```
