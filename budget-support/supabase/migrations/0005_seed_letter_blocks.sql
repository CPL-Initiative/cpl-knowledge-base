insert into public.letter_blocks (campaign_id, block_key, scope, content, updated_by)
values ((select id from public.campaigns where slug='may-2026-revise-rc'), 'opening', 'all', 'On behalf of the {{ORG_NAME}}, representing California Community Colleges across the {{REGION}} region, I write to urge you to prioritize continued investment in Credit for Prior Learning (CPL) implementation statewide. CPL plays a critical role in helping students accelerate completion of degrees and certificates by recognizing the valuable skills and knowledge they have already gained through military service, workforce training, apprenticeships, industry certifications, and other professional experiences.', 'seed')
on conflict (campaign_id, block_key, scope) do update set content = excluded.content;

insert into public.letter_blocks (campaign_id, block_key, scope, content, updated_by)
values ((select id from public.campaigns where slug='may-2026-revise-rc'), 'rationale', 'all', 'Colleges throughout our region have implemented CPL opportunities in programs such as {{PROGRAMS}} and have collectively awarded {{UNITS_AWARDED}} units of CPL credit to {{STUDENTS_SERVED}} students. CPL has been particularly important in our region because {{REASON}}. Additional investment would allow colleges across our consortium to expand CPL opportunities through increased faculty evaluation capacity, counseling and outreach support, technology infrastructure, and stronger alignment with regional industry and workforce partners.', 'seed')
on conflict (campaign_id, block_key, scope) do update set content = excluded.content;

insert into public.letter_blocks (campaign_id, block_key, scope, content, updated_by)
values ((select id from public.campaigns where slug='may-2026-revise-rc'), 'stats', 'all', 'Statewide, CPL has already served {{SW_STUDENTS}} students — including {{SW_MILITARY}} veterans and military-connected learners, {{SW_WORKFORCE}} workforce/other adults, and {{SW_APPRENTICE}} apprentices — across {{SW_ACTIVE_COLLEGES}} of California''s {{SW_TOTAL_COLLEGES}} community colleges, with {{SW_LEADING_COLLEGES}} colleges meeting the leading-implementation criteria. Together these colleges have transcribed {{SW_TRANSCRIBED_UNITS}} units of prior learning credit out of {{SW_ELIGIBLE_UNITS}} eligible units identified, generating an estimated {{SW_SAVINGS}} in student cost savings to date and a projected {{SW_20Y_IMPACT}} in 20-year economic impact.', 'seed')
on conflict (campaign_id, block_key, scope) do update set content = excluded.content;

insert into public.letter_blocks (campaign_id, block_key, scope, content, updated_by)
values ((select id from public.campaigns where slug='may-2026-revise-rc'), 'example', 'all', 'One example of CPL’s impact within our region is {{EXAMPLE_NARRATIVE}}. Through CPL, students with prior military, workforce, apprenticeship, or industry experience have been able to {{OUTCOME}}, reducing both the time and cost required to complete their educational goals while helping address critical workforce shortages in our local economy.', 'seed')
on conflict (campaign_id, block_key, scope) do update set content = excluded.content;

insert into public.letter_blocks (campaign_id, block_key, scope, content, updated_by)
values ((select id from public.campaigns where slug='may-2026-revise-rc'), 'ask', 'all', 'Specifically, we urge your support of the May Revise request for $37 million in Credit for Prior Learning funding — $2 million in ongoing funding to sustain CPL infrastructure operations and $35 million in one-time funding to support local college CPL implementation and CPL innovation projects.', 'seed')
on conflict (campaign_id, block_key, scope) do update set content = excluded.content;

insert into public.letter_blocks (campaign_id, block_key, scope, content, updated_by)
values ((select id from public.campaigns where slug='may-2026-revise-rc'), 'cta', 'all', 'We urge you to support policies and funding that sustain and strengthen CPL implementation throughout the California Community Colleges. Thank you for your continued support of California’s students and for your commitment to higher education, workforce development, and economic mobility.', 'seed')
on conflict (campaign_id, block_key, scope) do update set content = excluded.content;

insert into public.letter_blocks (campaign_id, block_key, scope, content, updated_by)
values ((select id from public.campaigns where slug='may-2026-revise-college'), 'opening', 'all', 'On behalf of {{ORG_NAME}}, I write to urge you to prioritize continued investment in Credit for Prior Learning (CPL) across the California Community Colleges. CPL plays a critical role in helping students accelerate completion of degrees and certificates by recognizing the valuable skills and knowledge they have already gained through military service, workforce training, apprenticeships, industry certifications, and other professional experiences.', 'seed')
on conflict (campaign_id, block_key, scope) do update set content = excluded.content;

insert into public.letter_blocks (campaign_id, block_key, scope, content, updated_by)
values ((select id from public.campaigns where slug='may-2026-revise-college'), 'rationale', 'all', 'Investing in CPL is essential to California’s workforce and economic future. By translating real-world learning into college credit, CPL reduces unnecessary duplication of coursework, lowers costs for students, and helps learners enter or advance within the workforce more quickly. CPL is especially impactful for veterans, working adults, apprentices, and first responders, helping remove longstanding barriers while creating clearer pathways to high-skill, high-wage careers.', 'seed')
on conflict (campaign_id, block_key, scope) do update set content = excluded.content;

insert into public.letter_blocks (campaign_id, block_key, scope, content, updated_by)
values ((select id from public.campaigns where slug='may-2026-revise-college'), 'stats', 'all', 'Statewide, CPL has already served {{SW_STUDENTS}} students — including {{SW_MILITARY}} veterans and military-connected learners, {{SW_WORKFORCE}} workforce/other adults, and {{SW_APPRENTICE}} apprentices — across {{SW_ACTIVE_COLLEGES}} of California''s {{SW_TOTAL_COLLEGES}} community colleges, with {{SW_LEADING_COLLEGES}} colleges meeting the leading-implementation criteria. Together these colleges have transcribed {{SW_TRANSCRIBED_UNITS}} units of prior learning credit out of {{SW_ELIGIBLE_UNITS}} eligible units identified, generating an estimated {{SW_SAVINGS}} in student cost savings to date and a projected {{SW_20Y_IMPACT}} in 20-year economic impact.', 'seed')
on conflict (campaign_id, block_key, scope) do update set content = excluded.content;

insert into public.letter_blocks (campaign_id, block_key, scope, content, updated_by)
values ((select id from public.campaigns where slug='may-2026-revise-college'), 'institution', 'all', 'Currently, my institution has awarded {{UNITS_AWARDED}} units of CPL credit to {{STUDENTS_SERVED}} students and has implemented CPL opportunities in programs such as {{PROGRAMS}}. CPL has been particularly important for our students because {{REASON}}. Additional investment would allow our college to expand CPL opportunities by {{EXPANSION}}.', 'seed')
on conflict (campaign_id, block_key, scope) do update set content = excluded.content;

insert into public.letter_blocks (campaign_id, block_key, scope, content, updated_by)
values ((select id from public.campaigns where slug='may-2026-revise-college'), 'example', 'all', 'One example of CPL’s impact at our college is {{EXAMPLE_NARRATIVE}}. Through CPL, students with prior military, workforce, or industry experience have been able to {{OUTCOME}}, reducing both the time and cost required to complete their educational goals while helping address local workforce needs.', 'seed')
on conflict (campaign_id, block_key, scope) do update set content = excluded.content;

insert into public.letter_blocks (campaign_id, block_key, scope, content, updated_by)
values ((select id from public.campaigns where slug='may-2026-revise-college'), 'ask', 'all', 'Specifically, I urge your support of the May Revise request for $37 million in Credit for Prior Learning funding — $2 million in ongoing funding to sustain CPL infrastructure operations and $35 million in one-time funding to support local college CPL implementation and CPL innovation projects.', 'seed')
on conflict (campaign_id, block_key, scope) do update set content = excluded.content;

insert into public.letter_blocks (campaign_id, block_key, scope, content, updated_by)
values ((select id from public.campaigns where slug='may-2026-revise-college'), 'cta', 'all', 'I urge you to support policies and funding that sustain and strengthen CPL implementation throughout the California Community Colleges. Thank you for your continued support of California’s students and for your commitment to higher education and workforce opportunity.', 'seed')
on conflict (campaign_id, block_key, scope) do update set content = excluded.content;

insert into public.letter_blocks (campaign_id, block_key, scope, content, updated_by)
values ((select id from public.campaigns where slug='may-2026-revise-rc'), 'opening', 'statewide', 'On behalf of the CPL Initiative at the California Community Colleges Chancellor''s Office, supporting Credit for Prior Learning (CPL) implementation across all {{SW_TOTAL_COLLEGES}} community colleges and 8 regional consortia, we write to urge you to prioritize continued investment in Credit for Prior Learning across the California Community Colleges. CPL plays a critical role in helping students accelerate completion of degrees and certificates by recognizing the valuable skills and knowledge they have already gained through military service, workforce training, apprenticeships, industry certifications, and other professional experiences.', 'seed')
on conflict (campaign_id, block_key, scope) do update set content = excluded.content;

insert into public.letter_blocks (campaign_id, block_key, scope, content, updated_by)
values ((select id from public.campaigns where slug='may-2026-revise-rc'), 'rationale', 'statewide', 'Colleges across California have implemented CPL opportunities in programs such as Law Enforcement (POST), Emergency Medical Services, Construction Trades, First Responder Training, Electrician Apprenticeships, and Behavioral Health, with the strongest impact for the populations CPL most directly benefits — veterans and military-connected learners, working adults, apprentices, and first responders, students who would otherwise face the longest barriers to degree and certificate completion. Continued investment would allow more colleges to expand CPL opportunities through increased faculty evaluation capacity, counseling and outreach support, technology infrastructure, and stronger alignment with regional industry and workforce partners.', 'seed')
on conflict (campaign_id, block_key, scope) do update set content = excluded.content;

insert into public.letter_blocks (campaign_id, block_key, scope, content, updated_by)
values ((select id from public.campaigns where slug='may-2026-revise-rc'), 'example', 'statewide', 'One example of CPL''s impact is the cohort of {{SW_LEADING_COLLEGES}} leading-implementation colleges — including Merced College, Los Angeles Pierce College, Moreno Valley College, Norco College, Riverside City College, and West Los Angeles College — that each meet all five rigorous CPL benchmarks (student volume, eligible units, average eligible units per student, transcription rate, and average transcribed units per student). Through CPL, students with prior military, workforce, apprenticeship, or industry experience have been able to complete their educational goals more efficiently, reducing both the time and cost required while helping address critical workforce shortages across California''s economy.', 'seed')
on conflict (campaign_id, block_key, scope) do update set content = excluded.content;

insert into public.letter_blocks (campaign_id, block_key, scope, content, updated_by)
values ((select id from public.campaigns where slug='may-2026-revise-college'), 'opening', 'statewide', 'On behalf of the CPL Initiative at the California Community Colleges Chancellor''s Office, supporting Credit for Prior Learning (CPL) implementation across California''s {{SW_TOTAL_COLLEGES}} community colleges, we write to urge you to prioritize continued investment in Credit for Prior Learning across the California Community Colleges. CPL plays a critical role in helping students accelerate completion of degrees and certificates by recognizing the valuable skills and knowledge they have already gained through military service, workforce training, apprenticeships, industry certifications, and other professional experiences.', 'seed')
on conflict (campaign_id, block_key, scope) do update set content = excluded.content;

insert into public.letter_blocks (campaign_id, block_key, scope, content, updated_by)
values ((select id from public.campaigns where slug='may-2026-revise-college'), 'institution', 'statewide', 'California Community Colleges have implemented CPL opportunities in programs such as Law Enforcement (POST), Emergency Medical Services, Construction Trades, First Responder Training, Electrician Apprenticeships, and Behavioral Health, with the strongest impact for the populations CPL most directly benefits — veterans, working adults, apprentices, and first responders, students who would otherwise face the longest barriers to degree and certificate completion. Continued investment would allow more colleges to expand CPL opportunities through increased faculty evaluation capacity, counseling and outreach support, technology infrastructure, and stronger alignment with regional industry partners.', 'seed')
on conflict (campaign_id, block_key, scope) do update set content = excluded.content;

insert into public.letter_blocks (campaign_id, block_key, scope, content, updated_by)
values ((select id from public.campaigns where slug='may-2026-revise-college'), 'example', 'statewide', 'One example of CPL''s impact is the cohort of {{SW_LEADING_COLLEGES}} leading-implementation colleges — including Merced College, Los Angeles Pierce College, Moreno Valley College, Norco College, Riverside City College, and West Los Angeles College — that each meet all five rigorous CPL benchmarks (student volume, eligible units, average eligible units per student, transcription rate, and average transcribed units per student). Through CPL, students with prior military, workforce, or industry experience have been able to complete their educational goals more efficiently, reducing both the time and cost required while helping address local workforce needs across California.', 'seed')
on conflict (campaign_id, block_key, scope) do update set content = excluded.content;

