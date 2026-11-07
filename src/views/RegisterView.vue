<!-- 註冊頁只處理表單；API、欄位錯誤與 loading 統一由 auth store／service 管理。 -->
<script setup lang="ts">
import { ArrowRight, CheckCircle2, Eye, EyeOff } from "@lucide/vue";
import { computed, nextTick, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import BaseButton from "../components/BaseButton.vue";
import { useAuthStore } from "../stores/auth";
import {
  getAuthRedirect,
  validateRegistration,
  type RegistrationErrors,
} from "../utils/auth";

const auth = useAuthStore();
const route = useRoute();
const values = reactive({
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
});
const errors = ref<RegistrationErrors>({});
const showPassword = ref(false);
const submitting = ref(false);
const registered = ref(false);
const loginTarget = computed(() => ({
  name: "login",
  query: { redirect: getAuthRedirect(route.query.redirect) },
}));

async function focusFirstError() {
  const firstInvalid = Object.keys(errors.value)[0];
  if (!firstInvalid) return;
  await nextTick();
  document.getElementById(`register-${firstInvalid}`)?.focus();
}

async function submit() {
  if (submitting.value || auth.busy) return;
  auth.error = "";
  auth.registrationErrors = {};
  errors.value = validateRegistration(values);
  if (Object.keys(errors.value).length) {
    await focusFirstError();
    return;
  }
  submitting.value = true;
  try {
    if (await auth.register(values)) {
      // API 不會自動登入。成功後顯示登入入口，密碼只從表單記憶體清除。
      registered.value = true;
      values.password = "";
      values.confirmPassword = "";
      await nextTick();
      document.getElementById("registration-success")?.focus();
    } else {
      // 將後端的重複 Email／驗證錯誤放回對應欄位；失敗時保留密碼方便修改。
      errors.value = { ...auth.registrationErrors };
    }
  } finally {
    submitting.value = false;
  }
  // 先解除 fieldset 的 disabled，nextTick 後才能成功聚焦後端回報的錯誤欄位。
  if (!registered.value) await focusFirstError();
}
</script>

<template>
  <main class="auth-view container">
    <section class="auth-intro" aria-labelledby="register-title">
      <p class="auth-intro__eyebrow">CURIO MEMBERS</p>
      <h1 id="register-title">
        {{ registered ? "歡迎加入。" : "一起收藏日常。" }}
      </h1>
      <p class="auth-intro__description">
        建立你的 Curio 帳號，<br />從喜歡的好物開始。
      </p>
      <RouterLink class="auth-intro__link" to="/products">
        先逛逛精選商品 <ArrowRight :size="18" aria-hidden="true" />
      </RouterLink>
    </section>

    <section class="auth-card" aria-labelledby="register-form-title">
      <header>
        <h2 id="register-form-title">
          {{ registered ? "註冊完成" : "建立會員帳號" }}
        </h2>
        <p>
          {{
            registered
              ? "帳號已建立，請登入後開始使用。"
              : "填寫以下資料，加入 Curio。"
          }}
        </p>
      </header>

      <div
        v-if="registered"
        id="registration-success"
        class="auth-success"
        tabindex="-1"
        role="status"
      >
        <CheckCircle2 :size="40" aria-hidden="true" />
        <p>註冊成功！</p>
        <p>請使用剛才建立的電子郵件與密碼登入。</p>
        <RouterLink class="auth-intro__link" :to="loginTarget">
          前往登入 <ArrowRight :size="18" aria-hidden="true" />
        </RouterLink>
      </div>

      <template v-else>
        <form novalidate :aria-busy="submitting" @submit.prevent="submit">
          <fieldset :disabled="submitting || auth.busy">
            <legend class="sr-only">註冊資料</legend>
            <div class="auth-field">
              <label for="register-name">會員名稱</label>
              <input
                id="register-name"
                v-model="values.name"
                name="name"
                type="text"
                autocomplete="name"
                maxlength="50"
                required
                :aria-invalid="Boolean(errors.name)"
                :aria-describedby="
                  errors.name ? 'register-name-error' : undefined
                "
              />
              <p
                v-if="errors.name"
                id="register-name-error"
                class="auth-field__error"
              >
                {{ errors.name }}
              </p>
            </div>
            <div class="auth-field">
              <label for="register-email">電子郵件</label>
              <input
                id="register-email"
                v-model="values.email"
                name="email"
                type="email"
                autocomplete="email"
                inputmode="email"
                autocapitalize="none"
                :spellcheck="false"
                maxlength="254"
                placeholder="you@example.com"
                required
                :aria-invalid="Boolean(errors.email)"
                :aria-describedby="
                  errors.email ? 'register-email-error' : undefined
                "
              />
              <p
                v-if="errors.email"
                id="register-email-error"
                class="auth-field__error"
              >
                {{ errors.email }}
              </p>
            </div>
            <div class="auth-field">
              <label for="register-password">密碼</label>
              <div class="auth-field__password">
                <input
                  id="register-password"
                  v-model="values.password"
                  name="password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  minlength="8"
                  maxlength="128"
                  required
                  :aria-invalid="Boolean(errors.password)"
                  :aria-describedby="
                    errors.password
                      ? 'register-password-help register-password-error'
                      : 'register-password-help'
                  "
                />
                <button
                  type="button"
                  :aria-label="showPassword ? '隱藏密碼' : '顯示密碼'"
                  :aria-pressed="showPassword"
                  aria-controls="register-password register-confirmPassword"
                  @click="showPassword = !showPassword"
                >
                  <EyeOff v-if="showPassword" :size="19" aria-hidden="true" />
                  <Eye v-else :size="19" aria-hidden="true" />
                </button>
              </div>
              <p id="register-password-help" class="auth-field__help">
                8～128 個字元，包含大小寫英文字母與數字。
              </p>
              <p
                v-if="errors.password"
                id="register-password-error"
                class="auth-field__error"
              >
                {{ errors.password }}
              </p>
            </div>
            <div class="auth-field">
              <label for="register-confirmPassword">確認密碼</label>
              <input
                id="register-confirmPassword"
                v-model="values.confirmPassword"
                name="confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                maxlength="128"
                required
                :aria-invalid="Boolean(errors.confirmPassword)"
                :aria-describedby="
                  errors.confirmPassword
                    ? 'register-confirmPassword-error'
                    : undefined
                "
              />
              <p
                v-if="errors.confirmPassword"
                id="register-confirmPassword-error"
                class="auth-field__error"
              >
                {{ errors.confirmPassword }}
              </p>
            </div>
            <p v-if="auth.error" class="auth-alert" role="alert">
              {{ auth.error }}
            </p>
            <BaseButton type="submit" :loading="submitting">
              {{ submitting ? "建立帳號中…" : "建立帳號" }}
              <ArrowRight v-if="!submitting" :size="17" aria-hidden="true" />
            </BaseButton>
          </fieldset>
        </form>
        <p class="auth-links">
          已經有帳號？ <RouterLink :to="loginTarget">前往登入</RouterLink>
        </p>
      </template>
    </section>
  </main>
</template>

<style scoped src="../styles/auth.css"></style>
