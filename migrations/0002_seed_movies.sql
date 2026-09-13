INSERT OR REPLACE INTO movies (
  id, slug, title, original_title, tagline, description, year, rating,
  duration_minutes, maturity, genres, poster_url, backdrop_url, featured,
  trending_rank
) VALUES
  (
    'movie-interstellar', 'interstellar', '星际穿越', 'Interstellar',
    '人类的下一站，是星辰大海。',
    '当尘埃风暴让地球逐渐失去宜居条件，一支探险队穿越虫洞，寻找人类可以延续文明的新家园。',
    2014, 9.4, 169, 'PG-13', '科幻,冒险,剧情',
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=520&h=780&q=82',
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1800&h=1000&q=82',
    1, 1
  ),
  (
    'movie-dune-part-two', 'dune-part-two', '沙丘 2', 'Dune: Part Two',
    '浴火而生，向沙海而行。',
    '保罗·厄崔迪与契妮及弗雷曼人联手，踏上复仇之路，同时努力避免自己预见的可怕未来。',
    2024, 9.1, 166, 'PG-13', '科幻,动作,冒险',
    'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=520&h=780&q=82',
    'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1800&h=1000&q=82',
    0, 2
  ),
  (
    'movie-the-last-of-us', 'the-last-of-us', '最后生还者', 'The Last of Us',
    '在失去一切之后，仍然选择相信。',
    '一场改变文明的疫情之后，两个被迫结伴同行的幸存者穿越废墟，寻找关于未来的答案。',
    2023, 9.0, 54, '16+', '剧情,惊悚,冒险',
    'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=520&h=780&q=82',
    'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1800&h=1000&q=82',
    0, 3
  ),
  (
    'movie-blade-runner', 'blade-runner-2049', '银翼杀手 2049', 'Blade Runner 2049',
    '未来已来，只是尚未平均。',
    '一名年轻的银翼杀手发现了一个埋藏已久的秘密，线索将他引向三十年前失踪的前任警员。',
    2017, 8.8, 164, '16+', '科幻,悬疑,剧情',
    'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=520&h=780&q=82',
    'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1800&h=1000&q=82',
    0, 4
  ),
  (
    'movie-into-the-wild', 'into-the-wild', '荒野生存', 'Into the Wild',
    '有些人选择离开，是为了真正抵达。',
    '一个刚毕业的年轻人放弃安稳生活，独自踏上横跨北美的旅程，寻找内心真正的自由。',
    2007, 8.7, 148, 'PG-13', '剧情,冒险',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=520&h=780&q=82',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&h=1000&q=82',
    0, 5
  ),
  (
    'movie-her', 'her', '她', 'Her',
    '爱，是一种我们共同学习的语言。',
    '一位孤独的作家与先进的人工智能建立起亲密关系，重新思考人类情感与陪伴的边界。',
    2013, 8.5, 126, 'R', '爱情,科幻,剧情',
    'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=520&h=780&q=82',
    'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1800&h=1000&q=82',
    0, 6
  ),
  (
    'movie-the-batman', 'the-batman', '新蝙蝠侠', 'The Batman',
    '未被看见的真相，才是最深的黑暗。',
    '哥谭市接连发生命案，蝙蝠侠必须深入城市腐败的根源，揭开一场席卷家族与权力的阴谋。',
    2022, 8.4, 176, 'PG-13', '动作,犯罪,悬疑',
    'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=520&h=780&q=82',
    'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1800&h=1000&q=82',
    0, 7
  ),
  (
    'movie-arrival', 'arrival', '降临', 'Arrival',
    '语言，是理解世界的第一种方式。',
    '神秘飞船降临地球，一位语言学家受命解读未知生命的语言，试图阻止全球冲突。',
    2016, 8.3, 116, 'PG-13', '科幻,剧情,悬疑',
    'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=520&h=780&q=82',
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1800&h=1000&q=82',
    0, 8
  ),
  (
    'movie-spider-verse', 'spider-man-across-the-spider-verse',
    '蜘蛛侠：纵横宇宙', 'Spider-Man: Across the Spider-Verse',
    '每个宇宙，都有一个选择。',
    '迈尔斯·莫拉莱斯再次踏入多元宇宙，遇见一群蜘蛛侠，也迎来必须独自做出的命运选择。',
    2023, 8.9, 140, 'PG', '动画,动作,冒险',
    'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=520&h=780&q=82',
    'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1800&h=1000&q=82',
    0, 9
  ),
  (
    'movie-poor-things', 'poor-things', '可怜的东西', 'Poor Things',
    '她要重新发明自己的人生。',
    '一位年轻女性在奇异的科学实验中重获新生，随后踏上跨越大陆的成长与自我发现之旅。',
    2023, 8.1, 141, 'R', '喜剧,爱情,剧情',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=520&h=780&q=82',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&h=1000&q=82',
    0, 10
  ),
  (
    'movie-mad-max', 'mad-max-fury-road', '疯狂的麦克斯：狂暴女神',
    'Mad Max: Fury Road', '希望是一种反抗。',
    '在末日荒原上，一群逃亡者驾驶战车穿越沙海，与暴君展开一场关于自由的追逐。',
    2015, 8.6, 120, 'R', '动作,科幻,冒险',
    'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=520&h=780&q=82',
    'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1800&h=1000&q=82',
    0, 11
  ),
  (
    'movie-little-women', 'little-women', '小妇人', 'Little Women',
    '她们的故事，由她们自己书写。',
    '四姐妹在成长、离别与重逢中寻找各自的人生方向，并用自己的方式定义爱与成功。',
    2019, 8.2, 135, 'PG', '剧情,爱情',
    'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=520&h=780&q=82',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&h=1000&q=82',
    0, 12
  );
