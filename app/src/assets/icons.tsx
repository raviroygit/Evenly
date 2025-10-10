import { Ionicons } from '@expo/vector-icons';

export const icons = {
  index: (props: any) => <Ionicons name="home-outline" size={26} {...props} />,
  expenses: (props: any) => <Ionicons name="receipt-outline" size={26} {...props} />,
  groups: (props: any) => <Ionicons name="people-outline" size={26} {...props} />,
  profile: (props: any) => <Ionicons name="person-outline" size={26} {...props} />,
};
