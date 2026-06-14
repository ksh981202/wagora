-- situations / styles 계열: text → text[] (CSV 쉼표 구분 값)
alter table public.nail_designs
  alter column situations type text[] using (
    case
      when situations is null or trim(situations::text) = '' then '{}'::text[]
      when situations::text like '{%}' then situations::text[]
      else string_to_array(situations::text, ',')
    end
  );

alter table public.nail_designs
  alter column occasion_en type text[] using (
    case
      when occasion_en is null or trim(occasion_en::text) = '' then '{}'::text[]
      when occasion_en::text like '{%}' then occasion_en::text[]
      else string_to_array(occasion_en::text, ',')
    end
  );

alter table public.nail_designs
  alter column styles type text[] using (
    case
      when styles is null or trim(styles::text) = '' then '{}'::text[]
      when styles::text like '{%}' then styles::text[]
      else string_to_array(styles::text, ',')
    end
  );

alter table public.nail_designs
  alter column styles_en type text[] using (
    case
      when styles_en is null or trim(styles_en::text) = '' then '{}'::text[]
      when styles_en::text like '{%}' then styles_en::text[]
      else string_to_array(styles_en::text, ',')
    end
  );

alter table public.nail_designs alter column situations set default '{}';
alter table public.nail_designs alter column occasion_en set default '{}';
alter table public.nail_designs alter column styles set default '{}';
alter table public.nail_designs alter column styles_en set default '{}';
