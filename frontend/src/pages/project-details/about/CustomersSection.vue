<script setup lang="ts">
import CustomerRow from "./CustomerRow.vue";
import ExpandableList from "./ExpandableList.vue";
import { useProjectSidebar } from "./useProjectSidebar";

const { customers } = useProjectSidebar();
</script>

<template>
  <ExpandableList
    :items="customers"
    item-label="customers"
    :item-key="(customer) => customer.contactId"
  >
    <template #default="{ item }">
      <CustomerRow :customer="item" />
    </template>
  </ExpandableList>
</template>
