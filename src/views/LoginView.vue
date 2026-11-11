<!-- 登入頁只負責輸入、提示與導覽；帳密驗證及狀態保存由 auth store／service 處理。 -->
<script setup lang="ts">
import { Eye, EyeOff } from "@lucide/vue";
import { nextTick, reactive, ref } from "vue";
import { isNavigationFailure, useRoute, useRouter } from "vue-router";
import BaseButton from "../components/BaseButton.vue";
import { demoCredentials } from "../services/authService";
import { useAuthStore } from "../stores/auth";
import {
  getAuthRedirect,
  validateLogin,
  type LoginErrors,
} from "../utils/auth";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const values = reactive({ email: "", password: "" });
const errors = ref<LoginErrors>({});
const showPassword = ref(false);
const submitting = ref(false);
const navigationError = ref("");

async function fillDemo() {
  Object.assign(values, demoCredentials);
  errors.value = {};
  auth.error = "";
  await nextTick();
  document.getElementById("login-submit")?.focus();
}

async function submit() {
  if (submitting.value || auth.busy) return;
  auth.error = "";
  navigationError.value = "";
  errors.value = validateLogin(values);
  const firstInvalid = Object.keys(errors.value)[0];
  if (firstInvalid) {
    await nextTick();
    document.getElementById(`login-${firstInvalid}`)?.focus();
    return;
  }
  submitting.value = true;
  try {
    if (await auth.login(values)) {
      // 失敗時保留輸入方便修改；只有登入成功才清除表單中的密碼。
      values.password = "";
      // 不直接信任網址中的 redirect，統一經過站內網址檢查。
      const result = await router.replace(
        getAuthRedirect(route.query.redirect),
      );
      if (isNavigationFailure(result)) throw result;
    }
  } catch {
    navigationError.value = "無法開啟會員頁，請重試或從上方進入會員中心。";
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <main class="auth-view container">
    <section class="auth-intro" aria-labelledby="login-title">
      <h1 id="login-title">會員登入</h1>
      <p class="auth-intro__description">登入後可結帳及查詢訂單紀錄。</p>
      <RouterLink class="auth-intro__link" to="/products">
        瀏覽商品
      </RouterLink>
      <p class="auth-intro__note">可使用頁面提供的示範帳號體驗購物。</p>
    </section>

    <section class="auth-card" aria-labelledby="login-form-title">
      <header>
        <h2 id="login-form-title">登入資料</h2>
        <p>使用電子郵件與密碼登入你的帳號。</p>
      </header>
      <form novalidate :aria-busy="submitting" @submit.prevent="submit">
        <fieldset :disabled="submitting || auth.busy">
          <legend class="sr-only">登入資料</legend>
          <div class="auth-field">
            <label for="login-email">電子郵件</label>
            <input
              id="login-email"
              v-model="values.email"
              name="email"
              type="email"
              autocomplete="username"
              inputmode="email"
              autocapitalize="none"
              :spellcheck="false"
              placeholder="you@example.com"
              required
              :aria-invalid="Boolean(errors.email)"
              :aria-describedby="errors.email ? 'login-email-error' : undefined"
            />
            <p
              v-if="errors.email"
              id="login-email-error"
              class="auth-field__error"
            >
              {{ errors.email }}
            </p>
          </div>
          <div class="auth-field">
            <label for="login-password">密碼</label>
            <div class="auth-field__password">
              <input
                id="login-password"
                v-model="values.password"
                name="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                required
                :aria-invalid="Boolean(errors.password)"
                :aria-describedby="
                  errors.password ? 'login-password-error' : undefined
                "
              />
              <button
                type="button"
                :aria-label="showPassword ? '隱藏密碼' : '顯示密碼'"
                :aria-pressed="showPassword"
                aria-controls="login-password"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" :size="19" aria-hidden="true" />
                <Eye v-else :size="19" aria-hidden="true" />
              </button>
            </div>
            <p
              v-if="errors.password"
              id="login-password-error"
              class="auth-field__error"
            >
              {{ errors.password }}
            </p>
          </div>
          <p
            v-if="auth.error || navigationError"
            class="auth-alert"
            role="alert"
          >
            {{ auth.error || navigationError }}
          </p>
          <BaseButton id="login-submit" type="submit" :loading="submitting">
            {{ submitting ? "登入中…" : "登入" }}
          </BaseButton>
        </fieldset>
      </form>
      <p class="auth-links">
        還沒有帳號？
        <RouterLink
          :to="{
            name: 'register',
            query: { redirect: getAuthRedirect(route.query.redirect) },
          }"
        >
          建立會員帳號
        </RouterLink>
      </p>
      <!-- 示範帳號與一般會員並存，不會將登入失敗的真實帳號切成示範。 -->
      <aside class="demo-account" aria-label="示範帳號">
        <strong>先體驗一下</strong>
        <p>
          帳號：{{ demoCredentials.email }}<br />密碼：{{
            demoCredentials.password
          }}
        </p>
        <BaseButton
          variant="secondary"
          :disabled="submitting || auth.busy"
          @click="fillDemo"
        >
          填入示範帳號
        </BaseButton>
        <small>僅供展示，請勿輸入真實帳密。</small>
      </aside>
    </section>
  </main>
</template>

<style scoped src="../styles/auth.css"></style>
