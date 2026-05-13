---
type: "url-dump"
category: "data"
project: "map-platform"
date: "2026-04-13"
created: "2026-04-13 13:05"
source: "No CID Courses.txt"
tags: ["#resource", "#map-platform", "#c-id", "#course-crosswalk", "#ai-matching", "#data"]
relevance: "high"
last_consolidated: "2026-04-19"
---

# No CID Courses — C-ID Course Crosswalk Data

## Summary
CSV dataset of C-ID (Course Identification Numbering System) course-to-college course mappings with AI-generated match percentages. Contains 238 rows covering ITIS 300-series courses (IT/Computer Science) across dozens of California community colleges. This is output from the AI certification-to-course matching project referenced in the CPL Initiative Report.

## Data Structure
| Column | Description |
|---|---|
| C-ID | Standard course identifier (e.g., ITIS 300) |
| C-ID Title | Standard course name (e.g., Advanced Programming Techniques) |
| College | California community college name |
| College Course Number | Local course number |
| College Course Title | Local course title |
| Units | Unit count |
| Match % | AI-generated match confidence (40%–95%) |

## Coverage
- **C-ID Courses:** ITIS 300 (Advanced Programming Techniques), ITIS 305 (Mobile App Development), ITIS 310 (Data Structures and Algorithms), and others in the 300-series
- **Colleges:** American River, Bakersfield, Butte, Cabrillo, Canada, Cerritos, College of Alameda, College of San Mateo, College of the Canyons, Contra Costa, Cypress, De Anza, East Los Angeles, and many more
- **Match Range:** 40%–95% confidence scores

## Strategic Notes
- This data supports the AI-accelerated common course crosswalk work referenced in the Draft CPL Update (goal: 20+ AI-generated crosswalks validated by June 30, 2026)
- Courses without a C-ID or Common Course Number (CCN) are the target for this crosswalk work — enabling statewide credit recommendations for courses that lack standardized identifiers
- The match percentages enable faculty workgroups to prioritize which crosswalks to validate first

## Connections
- **Related:** MAP Platform Scaling
- **Related:** CPL Initiative Report
- **Related:** Draft CPL Update

---

*Ingested from No CID Courses.txt by COG on 2026-04-13*
