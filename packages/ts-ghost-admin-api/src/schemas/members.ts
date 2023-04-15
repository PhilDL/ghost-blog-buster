import { z } from "zod";
import { baseMembersSchema } from "@ts-ghost/core-api";

export const adminMembersCreateSchema = z.object({
  email: z.string({ description: "The email address of the member" }),
  name: z.string({ description: "The name of the member" }).nullish(),
  note: z.string({ description: "(nullable) A note about the member" }).nullish(),
  geolocation: z.string({ description: "(nullable) The geolocation of the member" }).nullish(),
  labels: z
    .array(
      z.union([
        z.object({
          id: z.string({ description: "The ID of the label" }),
        }),
        z.object({
          name: z.string({ description: "The name of the label" }),
        }),
        z.object({
          slug: z.string({ description: "The slug of the label" }),
        }),
      ]),
      { description: "The labels associated with the member" }
    )
    .nullish(),
  products: z
    .array(
      z.union([
        z.object({
          id: z.string({ description: "The ID of the subscription" }),
        }),
        z.object({
          name: z.string({ description: "The name of the subscription" }),
        }),
        z.object({
          slug: z.string({ description: "The slug of the subscription" }),
        }),
      ]),
      {
        description: `The products associated with the member, they correspond to a stripe product. 
          If given the member status will be 'comped' as given away a subscription.`,
      }
    )
    .nullish(),
  // newsletters and subscribed exclude each other. `subscribed`
  newsletters: z
    .array(
      z.union([
        z.object({
          id: z.string({ description: "The ID of the newsletter" }),
        }),
        z.object({
          name: z.string({ description: "The name of the newsletter" }),
        }),
      ]),
      {
        description: `Specifing newsletter to subscribe to via id or name, incompatible with the \`subscribed\` property`,
      }
    )
    .nullish(),
  subscribed: z
    .boolean({
      description:
        "Will subscribe the user to the default Newsletter, incompatible with the `newsletters` property",
    })
    .nullish(),
  comped: z.boolean().nullish(),
  stripe_customer_id: z.string().nullish(),
  // subscriptions: NOT_USED it seems that subscriptions are not used on the API see Ghost source code: ghost/members-api/lib/repositories/member.js (method create)
});

export const adminMembersSchema = baseMembersSchema.merge(
  z.object({
    subscribed: z.boolean(),
    comped: z.boolean().nullish(),
    email_suppression: z
      .object({
        suppressed: z.boolean(),
        info: z.string().nullish(),
      })
      .nullish(),
  })
);

export type Member = z.infer<typeof adminMembersSchema>;
