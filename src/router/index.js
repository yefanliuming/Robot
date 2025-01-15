// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import taskedit from '../components/taskedit.vue'
import HelloWorld from '../components/HelloWorld.vue'
import receive from '../components/receive.vue'
import map from "../components/map.vue"
import TestImage from '@/components/TestImage.vue'
import About from "@/components/About.vue";
import newHello from "@/components/newHello.vue";
import login from "@/components/login.vue";
import test_HelloWorld  from "@/components/test_HelloWorld.vue";
import test_receive from "@/components/test_receive.vue";

const routes = [
  {
    path: '/',
    name: 'Operation',
    component: HelloWorld
  },
  {
    path: '/taskedit',
    name: 'taskedit',
    component: taskedit
  },
  {
    path: '/receive',
    name: 'receive',
    component: receive
  },
    {
    path: '/map',
    name: 'map',
    component: map
  },
    {
    path: '/op',
    name: 'op',
    component: HelloWorld
  },
  {
    path: '/test-image',
    name: 'TestImage',
    component: TestImage
  },
  {
    path: '/about',
    name: "About",
    component: About
  },
  {
    path: '/newhello',
    name: "newHello",
    component: newHello
  },
  {
    path: '/login',
    name: 'login',
    component: login
  },
  {
    path: '/test_hello',
    name: 'test_hello',
    component: test_HelloWorld
  },
  {
    path: '/test_receive',
    name: 'test_receive',
    component: test_receive
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
