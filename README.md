# ETHStars

![ETHStars Opportunities](https://ethstars.xyz)

## Design Philosophy

This page follows the ETHStars design language:
- **Dark theme** (#0C0C0F background)
- **Subtle glass effects** with minimal borders (rgba 6% white)
- **Clean typography** using Inter font
- **Purple accent color** (#8B5CF6)
- **Minimal visual noise** - content-focused design

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Language**: TypeScript

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/
│   ├── globals.css      # Theme styles matching ETHStars
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Main opportunities page
├── components/
│   ├── Navbar.tsx       # Navigation bar
│   ├── Footer.tsx       # Site footer
│   ├── FeaturedCarousel.tsx  # Featured opportunities slider
│   └── OpportunityTable.tsx  # Main sortable table
├── data/
│   └── opportunities.ts # Sample data
```

## Customization

### Adding Opportunities

Edit `data/opportunities.ts`:

```typescript
{
  id: '1',
  title: 'Job Title',
  company: 'Company Name',
  companyLogo: 'https://...',
  type: 'job' | 'bounty' | 'grant' | 'project',
  description: 'Description...',
  reward: '$100k - $150k',
  location: 'Remote',
  tags: ['Skill1', 'Skill2'],
  remote: true,
  featured: true,
  deadline: '2025-03-01', // optional
  applicants: 42, // optional
  postedAt: '2025-12-19',
  applicationUrl: '#',
  twitter: 'https://twitter.com/...',
}
```

### Theme Colors

Defined in `globals.css`:
- Background: `#0C0C0F`
- Border: `rgba(255, 255, 255, 0.06)`
- Accent: `#8B5CF6` (violet)
- Muted text: `#71717A`
