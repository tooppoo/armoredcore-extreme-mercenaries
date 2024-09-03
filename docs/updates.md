---
# metadata for jekyll
layout: default
title: 更新履歴
---

# 更新履歴

<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url }}">
        {{ post.title }} - {{ post.date | date: "%Y/%m/%d" }}
      </a>
    </li>
  {% endfor %}
</ul>
